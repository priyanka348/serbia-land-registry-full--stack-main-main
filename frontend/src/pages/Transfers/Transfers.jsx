// Transfers.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ArrowLeft,
  Download,
  Printer,
  Filter,
  Search,
  ChevronDown,
  Eye,
  X,
  Calendar,
  FileText,
} from "lucide-react";
import "./Transfers.css";
import { getTransfers } from "../../utils/api";

/* ----------------------------- Constants ----------------------------- */
const REGIONS = [
  "All Regions",
  "Belgrade",
  "Južna Bačka",
  "Severna Bačka",
  "Zapadna Bačka",
  "Srednji Banat",
  "Severni Banat",
  "Južni Banat",
  "Srem",
  "Mačva",
  "Kolubara",
  "Podunavlje",
  "Braničevo",
  "Šumadija",
  "Pomoravlje",
  "Bor",
  "Zaječar",
  "Zlatibor",
  "Moravica",
  "Raška",
  "Rasina",
  "Nišava",
  "Toplica",
  "Pirot",
  "Jablanica",
  "Pčinja",
];
const STATUSES = ["All Statuses", "Pending", "Approved", "Completed", "Rejected"];
const TYPES = ["Sale", "Inheritance", "Subdivision", "Donation", "Gift", "Exchange", "Other"];

const TIME_RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "This year", days: 365 },
  { label: "All time", days: 99999 },
];

// Backend status values
const BACKEND_STATUS_MAP = {
  "All Statuses": "",
  Pending: "pending_approval",
  Approved: "approved",
  Completed: "completed",
  Rejected: "rejected",
};

// Normalize backend status to display label
const STATUS_LABEL_MAP = {
  initiated: "Pending",
  pending_approval: "Pending",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Rejected",
};

// Normalize backend transfer type to display label
const TYPE_LABEL_MAP = {
  sale: "Sale",
  gift: "Donation",
  inheritance: "Inheritance",
  exchange: "Exchange",
  expropriation: "Other",
  court_order: "Other",
  other: "Other",
};

function getOwnerName(owner) {
  if (!owner) return "—";
  if (typeof owner === "string") return owner;
  if (owner.personalInfo) {
    const { firstName, lastName } = owner.personalInfo;
    return [firstName, lastName].filter(Boolean).join(" ") || owner._id || "—";
  }
  if (owner.corporateInfo?.companyName) return owner.corporateInfo.companyName;
  return owner._id || "—";
}

function normalizeTransfer(t) {
  return {
    id: t.transferId || t._id,
    parcelId: t.parcel?.parcelId || t.parcel?._id || "—",
    region: t.region || t.parcel?.region || "—",
    type: TYPE_LABEL_MAP[t.transferType] || t.transferType || "Other",
    status: STATUS_LABEL_MAP[t.transferStatus] || t.transferStatus || "Pending",
    buyer: getOwnerName(t.buyer),
    seller: getOwnerName(t.seller),
    value: t.agreedPrice || t.registeredPrice || 0,
    currency: "EUR",
    processingDays:
      t.processingTime ||
      Math.ceil((new Date() - new Date(t.applicationDate)) / (1000 * 60 * 60 * 24)),
    createdAt: t.applicationDate || t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || t.applicationDate || new Date().toISOString(),
    notes: t.notes || t.internalNotes || "",
  };
}

/* ----------------------------- Helpers ----------------------------- */
function formatEUR(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value || 0);
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
function safeAvg(nums) {
  const arr = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function toCSV(rows) {
  const header = [
    "Transfer ID",
    "Parcel ID",
    "Region",
    "Type",
    "Status",
    "Buyer",
    "Seller",
    "Value (EUR)",
    "Processing",
    "Created At",
  ];
  const lines = [header.join(",")];
  rows.forEach((r) => {
    const processing = r.processingDays == null ? "In progress" : `${r.processingDays} days`;
    const cols = [
      r.id,
      r.parcelId,
      r.region,
      r.type,
      r.status,
      r.buyer,
      r.seller,
      r.value ?? "",
      processing,
      fmtDate(r.createdAt),
    ].map((c) => `"${String(c ?? "").replaceAll('"', '""')}"`);
    lines.push(cols.join(","));
  });
  return lines.join("\n");
}
function downloadTextFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ----------------------------- Chart Colors ----------------------------- */
/* ✅ Required 4 colors: red, green, orange, blue */
const STATUS_COLORS = {
  Pending: "var(--trfx-orange)",
  Approved: "var(--trfx-blue)",
  Completed: "var(--trfx-good)",
  Rejected: "var(--trfx-red)",
};

/* ✅ Transfers by Type: ONLY 4 colors */
const TYPE_PALETTE_4 = [
  "var(--trfx-red)",
  "var(--trfx-good)",
  "var(--trfx-orange)",
  "var(--trfx-blue)",
];
function colorForType(type) {
  const idx = Math.abs(String(type).split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 4;
  return TYPE_PALETTE_4[idx];
}

/* ----------------------------- Main Component ----------------------------- */
export default function Transfers() {
  const navigate = useNavigate();

  // Raw data from backend
  const [allTransfers, setAllTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All Regions");
  const [timeRange, setTimeRange] = useState(TIME_RANGES[4]); // All time default
  const [status, setStatus] = useState("All Statuses");

  // View modal
  const [selected, setSelected] = useState(null);

  // Print mode (for PDF/print)
  const [printMode, setPrintMode] = useState(false);

  // ✅ Pagination: 15 per page
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);

  // Fetch transfers from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = { limit: 1000 };
    if (region !== "All Regions") params.region = region;
    const backendStatus = BACKEND_STATUS_MAP[status];
    if (backendStatus) params.status = backendStatus;

    getTransfers(params)
      .then((res) => {
        if (cancelled) return;
        if (res?.success) {
          setAllTransfers((res.data || []).map(normalizeTransfer));
        } else {
          setError("Failed to load transfers");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [region, status]);

  const filtered = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - timeRange.days);

    return allTransfers.filter((t) => {
      const matchesSearch =
        !search.trim() ||
        String(t.id).toLowerCase().includes(search.toLowerCase()) ||
        String(t.parcelId).toLowerCase().includes(search.toLowerCase()) ||
        String(t.buyer).toLowerCase().includes(search.toLowerCase()) ||
        String(t.seller).toLowerCase().includes(search.toLowerCase());

      const matchesRegion = region === "All Regions" || t.region === region;
      const matchesStatus = status === "All Statuses" || t.status === status;
      const createdAt = new Date(t.createdAt);
      const matchesTime = isNaN(createdAt.getTime()) ? true : createdAt >= cutoff;

      return matchesSearch && matchesRegion && matchesStatus && matchesTime;
    });
  }, [allTransfers, search, region, status, timeRange]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, region, status, timeRange, allTransfers.length]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered.length]);
  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const startIdx = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endIdx = Math.min(filtered.length, page * PAGE_SIZE);

  const kpis = useMemo(() => {
    const pending = filtered.filter((t) => t.status === "Pending").length;
    const approved = filtered.filter((t) => t.status === "Approved").length;
    const completed = filtered.filter((t) => t.status === "Completed").length;
    const rejected = filtered.filter((t) => t.status === "Rejected").length;

    const completedToday = filtered.filter((t) => {
      if (t.status !== "Completed") return false;
      const d = new Date(t.updatedAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;

    const avgProcessing = safeAvg(filtered.map((t) => t.processingDays)).toFixed(0);
    const totalValue = filtered.reduce((sum, t) => sum + (t.value || 0), 0);

    return {
      pending,
      approved,
      completed,
      rejected,
      completedToday,
      avgProcessing: Number(avgProcessing),
      totalValue,
    };
  }, [filtered]);

  const byStatus = useMemo(() => {
    const map = new Map();
    ["Pending", "Approved", "Completed", "Rejected"].forEach((s) => map.set(s, 0));
    filtered.forEach((t) => map.set(t.status, (map.get(t.status) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name],
    }));
  }, [filtered]);

  const byType = useMemo(() => {
    const map = new Map();
    TYPES.forEach((s) => map.set(s, 0));
    filtered.forEach((t) => map.set(t.type, (map.get(t.type) || 0) + 1));
    return Array.from(map.entries())
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value, color: colorForType(name) }));
  }, [filtered]);

  // bar chart last 7 days
  const barDaily = useMemo(() => {
    const days = 7;
    const labels = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push({
        key: d.toDateString(),
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        date: d,
        count: 0,
        value: 0,
      });
    }
    const idx = new Map(labels.map((x) => [x.key, x]));
    filtered.forEach((t) => {
      const d = new Date(t.createdAt);
      const key = d.toDateString();
      if (!idx.has(key)) return;
      const bucket = idx.get(key);
      bucket.count += 1;
      bucket.value += t.value || 0;
    });
    return labels;
  }, [filtered]);

  function resetFilters() {
    setSearch("");
    setRegion("All Regions");
    setTimeRange(TIME_RANGES[4]);
    setStatus("All Statuses");
  }

  function onExport() {
    const csv = toCSV(filtered);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`transfers_${stamp}.csv`, csv, "text/csv;charset=utf-8");
  }

  function onPrint() {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(false), 250);
    }, 60);
  }

  function onDownloadPDF() {
    // ✅ Use print-to-pdf (no dependency)
    onPrint();
  }

  // ✅ Print ONLY modal details
  function onDownloadSelectedPDF(t) {
    // put selected in printable state and trigger print
    setSelected(t);
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(false), 250);
    }, 60);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div id="trfx-page" className={`trfx-root ${printMode ? "trfx-printMode" : ""}`}>
      {/* Top breadcrumb + return */}
      <div className="trfx-topbar">
        <div className="trfx-breadcrumb">
          <span className="trfx-muted">Dashboard</span>
          <span className="trfx-muted">›</span>
          <span className="trfx-active">Transfers</span>
        </div>
        <button className="trfx-backBtn" onClick={() => navigate("/dashboard")} title="Return to dashboard">
          <ArrowLeft size={16} />
          Return
        </button>
      </div>

      <div className="trfx-header">
        <div>
          <h1 className="trfx-h1">Transfers Dashboard</h1>
          <p className="trfx-muted">Monitor property transfers and mutations</p>
        </div>
        <div className="trfx-headerActions">
          <button className="trfx-btn trfx-btnGhost" onClick={onPrint} title="Print">
            <Printer size={16} /> Print
          </button>
          <button className="trfx-btn trfx-btnPrimary" onClick={onExport} title="Export CSV">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="trfx-filterCard">
        <div className="trfx-filterTitleRow">
          <div className="trfx-filterTitle">
            <Filter size={16} />
            <span>Filters</span>
          </div>

          <button className="trfx-resetLink" onClick={resetFilters} type="button" title="Reset filters">
            <X size={16} />
            Reset filters
          </button>
        </div>

        <div className="trfx-filterRowTop">
          <div className="trfx-inputWrap trfx-inputWrapTop">
            <Search size={16} className="trfx-inputIcon" />
            <input
              className="trfx-input"
              placeholder="Search by ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={region} onChange={setRegion} options={REGIONS} leftIcon={<ChevronDown size={16} />} />

          <Select
            value={timeRange.label}
            onChange={(lbl) => setTimeRange(TIME_RANGES.find((x) => x.label === lbl) || TIME_RANGES[1])}
            options={TIME_RANGES.map((x) => x.label)}
            leftIcon={<Calendar size={16} />}
          />
        </div>
      </div>

      {/* Enhanced KPI cards (green/orange/red/blue) */}
      <div className="trfx-kpis">
        <KpiCard
          title="Pending"
          value={loading ? "…" : String(kpis.pending)}
          hint="Needs attention"
          icon={<span className="trfx-kpiIcon trfx-kpiIconOrange">⏳</span>}
        />
        <KpiCard
          title="Approved"
          value={loading ? "…" : String(kpis.approved)}
          hint="Ready for processing"
          icon={<span className="trfx-kpiIcon trfx-kpiIconBlue">✓</span>}
        />
        <KpiCard
          title="Completed"
          value={loading ? "…" : String(kpis.completed)}
          hint={`Completed today: ${loading ? "…" : String(kpis.completedToday)}`}
          icon={<span className="trfx-kpiIcon trfx-kpiIconGreen">✔</span>}
        />
        <KpiCard
          title="Rejected"
          value={loading ? "…" : String(kpis.rejected)}
          hint="Disputes / rejected"
          icon={<span className="trfx-kpiIcon trfx-kpiIconRed">✖</span>}
        />
      </div>

      {/* Charts */}
      <div className="trfx-charts">
        <div className="trfx-card">
          <div className="trfx-cardHeader">
            <h3 className="trfx-h3">Transfers by Status</h3>
          </div>
          <div className="trfx-cardBody trfx-chartBody">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={70} outerRadius={95} paddingAngle={2}>
                  {byStatus.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip formatter={(v, n) => [`${v}`, n]} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }} />
                <Legend verticalAlign="middle" align="right" layout="vertical" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="trfx-card">
          <div className="trfx-cardHeader">
            <h3 className="trfx-h3">Transfers by Type</h3>
          </div>
          <div className="trfx-cardBody trfx-chartBody">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" innerRadius={70} outerRadius={95} paddingAngle={2}>
                  {byType.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip formatter={(v, n) => [`${v}`, n]} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }} />
                <Legend verticalAlign="middle" align="right" layout="vertical" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar chart (ONLY red + blue) */}
      <div className="trfx-card trfx-wideCard">
        <div className="trfx-cardHeader trfx-cardHeaderRow">
          <h3 className="trfx-h3">Transfers in the last 7 days</h3>
          <span className="trfx-muted trfx-small">Hover bars to see count + value</span>
        </div>
        <div className="trfx-cardBody">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barDaily} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <ReTooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }}
                formatter={(v, name) => {
                  if (name === "count") return [`${v} transfers`, "Transfers"];
                  if (name === "value") return [formatEUR(v), "Total value"];
                  return [v, name];
                }}
                labelFormatter={(label) => `Day: ${label}`}
              />
              <Legend />
              <Bar dataKey="count" name="count" radius={[8, 8, 0, 0]} fill="var(--trfx-blue)" />
              <Bar dataKey="value" name="value" radius={[8, 8, 0, 0]} fill="var(--trfx-red)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="trfx-card trfx-wideCard">
        <div className="trfx-tableWrap">
          <div className="trfx-tableTitleRow">
            <div className="trfx-tableTitle">
              <span className="trfx-docIcon">📄</span>
              <h3 className="trfx-h3">Transfer Records</h3>
            </div>

            <div className="trfx-tableRight">
              <Select value={status} onChange={setStatus} options={STATUSES} leftIcon={<ChevronDown size={16} />} />
              <button className="trfx-btn trfx-btnGhost" onClick={onDownloadPDF} title="Download PDF">
                <FileText size={16} /> Download PDF
              </button>
              <button className="trfx-btn trfx-btnPrimary" onClick={onExport} title="Export CSV">
                <Download size={16} /> Export
              </button>
            </div>
          </div>

          <div className="trfx-table">
            <div className="trfx-thead">
              <div>Transfer ID</div>
              <div>Parcel ID</div>
              <div>Region</div>
              <div>Type</div>
              <div>Status</div>
              <div>Buyer</div>
              <div>Seller</div>
              <div>Value</div>
              <div>Processing</div>
              <div className="trfx-center">Action</div>
            </div>

            {loading ? (
              <div className="trfx-empty">
                <div className="trfx-emptyBox">
                  <div className="trfx-emptyTitle">Loading transfers...</div>
                </div>
              </div>
            ) : error ? (
              <div className="trfx-empty">
                <div className="trfx-emptyBox">
                  <div className="trfx-emptyTitle">Error: {error}</div>
                </div>
              </div>
            ) : pagedRows.length ? (
              pagedRows.map((t) => (
                <div className="trfx-trow" key={t.id}>
                  <div className="trfx-mono">{t.id}</div>
                  <div className="trfx-mono">{t.parcelId}</div>
                  <div>{t.region}</div>
                  <div>{t.type}</div>
                  <div>
                    <StatusPill status={t.status} />
                  </div>
                  <div className="trfx-truncate" title={t.buyer}>
                    {t.buyer}
                  </div>
                  <div className="trfx-truncate" title={t.seller}>
                    {t.seller}
                  </div>
                  <div className="trfx-mono">{formatEUR(t.value)}</div>
                  <div>{t.processingDays == null ? "In progress" : `${t.processingDays} days`}</div>
                  <div className="trfx-center">
                    <button className="trfx-linkBtn" onClick={() => setSelected(t)} title="View">
                      <Eye size={16} />
                      View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="trfx-empty">
                <div className="trfx-emptyBox">
                  <div className="trfx-emptyTitle">No results</div>
                  <div className="trfx-muted">Try adjusting filters or search terms.</div>
                </div>
              </div>
            )}
          </div>

          {/* footer + pagination */}
          <div className="trfx-tableFooterRow">
            <div className="trfx-tableFooterMuted">
              Showing <b>{startIdx}</b>–<b>{endIdx}</b> of <b>{filtered.length}</b> records
            </div>

            <div className="trfx-pagination">
              <button className="trfx-pageBtn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </button>
              <div className="trfx-pageInfo">
                Page <b>{page}</b> / <b>{totalPages}</b>
              </div>
              <button
                className="trfx-pageBtn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page footer */}
      <footer className="trfx-pageFooter">
        <div className="trfx-footerLeft">
          <div className="trfx-footerBrand">Transfer Management System</div>
          <div className="trfx-footerMuted">Secure • Trackable • Audit-ready</div>
        </div>
        <div className="trfx-footerRight">
          <span className="trfx-footerMuted">© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>

      {/* View Modal */}
      {selected && (
        <div className="trfx-modalOverlay" role="dialog" aria-modal="true" aria-label="Transfer details">
          <div className="trfx-modal">
            <div className="trfx-modalHeader">
              <div>
                <div className="trfx-modalTitle">Transfer Details</div>
                <div className="trfx-muted trfx-small">{selected.id}</div>
              </div>
              <button className="trfx-iconBtn" onClick={() => setSelected(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="trfx-modalBody trfx-printArea">
              <div className="trfx-detailGrid">
                <DetailItem label="Parcel ID" value={selected.parcelId} mono />
                <DetailItem label="Region" value={selected.region} />
                <DetailItem label="Type" value={selected.type} />
                <DetailItem label="Status" value={<StatusPill status={selected.status} />} />
                <DetailItem label="Buyer" value={selected.buyer} />
                <DetailItem label="Seller" value={selected.seller} />
                <DetailItem label="Value" value={formatEUR(selected.value)} mono />
                <DetailItem
                  label="Processing"
                  value={selected.processingDays == null ? "In progress" : `${selected.processingDays} days`}
                />
                <DetailItem label="Created" value={fmtDate(selected.createdAt)} />
                <DetailItem label="Last update" value={fmtDate(selected.updatedAt)} />
              </div>

              <div className="trfx-notes">
                <div className="trfx-notesTitle">Notes</div>
                <div className="trfx-notesBody">{selected.notes || "—"}</div>
              </div>
            </div>

            <div className="trfx-modalFooter">
              {/* Download PDF (print-to-pdf) */}
              <button className="trfx-btn trfx-btnPrimary" onClick={() => onDownloadSelectedPDF(selected)}>
                <FileText size={16} /> Download PDF
              </button>

              <button
                className="trfx-btn trfx-btnGhost"
                onClick={() => {
                  const csv = toCSV([selected]);
                  downloadTextFile(`${selected.id}.csv`, csv, "text/csv;charset=utf-8");
                }}
              >
                <Download size={16} /> Download CSV
              </button>

              <button className="trfx-btn trfx-btnGhost" onClick={onPrint}>
                <Printer size={16} /> Print
              </button>

              <button className="trfx-btn trfx-btnGhost" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Small UI Components ----------------------------- */
function KpiCard({ title, value, hint, icon }) {
  return (
    <div className="trfx-kpiCard">
      <div className="trfx-kpiTop">
        <div className="trfx-kpiTitle">{title}</div>
        <div className="trfx-kpiIconWrap">{icon}</div>
      </div>
      <div className="trfx-kpiValue">{value}</div>
      <div className="trfx-kpiHint">{hint}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const cls =
    status === "Rejected"
      ? "rejected"
      : status === "Pending"
      ? "pending"
      : status === "Approved"
      ? "approved"
      : status === "Completed"
      ? "completed"
      : "pending";

  return <span className={`trfx-pill ${cls}`}>{status}</span>;
}

function DetailItem({ label, value, mono }) {
  return (
    <div className="trfx-detailItem">
      <div className="trfx-detailLabel">{label}</div>
      <div className={`trfx-detailValue ${mono ? "trfx-mono" : ""}`}>{value}</div>
    </div>
  );
}

function Select({ value, onChange, options, leftIcon }) {
  return (
    <div className="trfx-selectWrap">
      <div className="trfx-selectLeftIcon">{leftIcon}</div>
      <select className="trfx-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}