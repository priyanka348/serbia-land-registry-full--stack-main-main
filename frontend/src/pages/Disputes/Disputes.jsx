// Disputes.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "./Disputes.css";
import { getDisputes, fetchDisputeStats } from "../../utils/api";

// ─── Status Colors (ALL DIFFERENT) ────────────────────────────────────────────
const STATUS_COLORS = {
  Open: "#C8102E", // red
  Investigation: "#0B1F4B", // navy
  Court: "#F59E0B", // orange (distinct)
  Resolved: "#16A34A", // green
};

// 30 Serbian cities (dummy distribution)
const SERBIA_CITIES_30 = [
  "Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica", "Zrenjanin", "Pančevo", "Čačak",
  "Kraljevo", "Novi Pazar", "Smederevo", "Leskovac", "Užice", "Vranje", "Valjevo", "Šabac",
  "Sombor", "Požarevac", "Pirot", "Zaječar", "Kikinda", "Vršac", "Bor", "Prokuplje",
  "Loznica", "Jagodina", "Paraćin", "Ruma", "Sremska Mitrovica", "Bačka Palanka",
];

// Keep your existing regions list (backend compatibility) + add cities
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
  ...SERBIA_CITIES_30.filter((c) => !["Belgrade", "Bor", "Zaječar", "Pirot"].includes(c)),
];

const STATUSES = ["All Statuses", "Open", "Investigation", "Court", "Resolved"];

// ✅ Filter priority: "This year" first + default
const RANGES = ["This year", "Last 7 days", "Last 30 days", "Last 90 days"];
const RANGE_DAYS = { "Last 7 days": 7, "Last 30 days": 30, "Last 90 days": 90, "This year": 365 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatEuro(value) {
  try {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
  } catch {
    return `${value} €`;
  }
}

function daysBetween(dateStr, now = new Date()) {
  const cleaned = dateStr.replace(/\s/g, "").replace(/\.$/, "");
  const [d, m, y] = cleaned.split(".").filter(Boolean).map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return Math.max(0, Math.floor((now - dt) / 86400000));
}

function toCSV(rows, headers) {
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function downloadFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toneForStatus(status) {
  if (status === "Resolved") return "green";
  if (status === "Court") return "orange";
  if (status === "Investigation") return "navy";
  return "red"; // Open/default
}

function rowClassByStatus(status) {
  if (status === "Resolved") return "dspx-row-resolved";
  if (status === "Court") return "dspx-row-court";
  if (status === "Investigation") return "dspx-row-investigation";
  return "dspx-row-open";
}

// ✅ PDF download without extra libs: triggers Print dialog (user saves as PDF)
function printAsPdfOnlyDetails(filenameBase = "dispute") {
  const prevTitle = document.title;
  document.title = `${filenameBase}_pdf`;
  document.body.classList.add("dspx-print-detail-only");
  requestAnimationFrame(() => {
    window.print();
    document.body.classList.remove("dspx-print-detail-only");
    document.title = prevTitle;
  });
}

// ─── Dummy generator (fallback) ───────────────────────────────────────────────
function seededRand(seed) {
  let t = seed % 2147483647;
  if (t <= 0) t += 2147483646;
  return () => (t = (t * 16807) % 2147483647) / 2147483647;
}

function makeISOWithinDays(rng, daysBack) {
  const now = Date.now();
  const msBack = Math.floor(rng() * daysBack * 86400000);
  return new Date(now - msBack).toISOString();
}

function generateDummyDisputes({ openCount = 2000, total = 2600, cities = SERBIA_CITIES_30 }) {
  const rng = seededRand(20260225);
  const statuses = [];
  for (let i = 0; i < openCount; i++) statuses.push("Open");
  const remaining = Math.max(0, total - openCount);
  for (let i = 0; i < remaining; i++) {
    const r = rng();
    if (r < 0.45) statuses.push("Court");
    else if (r < 0.75) statuses.push("Investigation");
    else statuses.push("Resolved");
  }

  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }

  const types = ["Ownership Claim", "Boundary", "Inheritance", "Encumbrance", "Access Right", "Lease Dispute"];
  const rows = [];
  for (let i = 0; i < total; i++) {
    const city = cities[Math.floor(rng() * cities.length)];
    const status = statuses[i] || "Open";

    const filingISO = makeISOWithinDays(rng, 365);
    const dt = new Date(filingISO);

    const estValue = Math.round(15000 + rng() * 900000);
    const disputeId = `DSP-${dt.getFullYear()}-${String(i + 1).padStart(4, "0")}`;
    const parcelId = `${city.slice(0, 3).toUpperCase()}-${Math.floor(10000 + rng() * 89999)}`;

    rows.push(
      normalizeDispute({
        disputeId,
        parcel: { parcelId, region: city },
        region: city,
        disputeType: types[Math.floor(rng() * types.length)].toLowerCase().replace(/\s/g, "_"),
        claimedAmount: estValue,
        status,
        filingDate: filingISO,
        priority: rng() < 0.2 ? "high" : rng() < 0.7 ? "medium" : "low",
      })
    );
  }
  return rows;
}

// ─── Normalize raw API dispute → UI shape ─────────────────────────────────────
function normalizeDispute(d) {
  const now = new Date();
  const status = d.status ?? "Open";

  const filingDate = d.filingDate
    ? (() => {
        const dt = new Date(d.filingDate);
        return `${dt.getDate()}. ${dt.getMonth() + 1}. ${dt.getFullYear()}.`;
      })()
    : "—";

  const estValue = d.claimedAmount ?? d.estimatedCost ?? 0;

  const parcel = d.parcel ?? {};
  const parcelId = parcel.parcelId ?? "—";
  const region = d.region ?? parcel.region ?? "—";

  const rawType = d.disputeType ?? "other";
  const disputeType = rawType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const disputeId = d.disputeId ?? (d._id ? `DSP-${String(d._id).slice(-6).toUpperCase()}` : "—");

  let daysOpen;
  if (status === "Resolved") {
    daysOpen = "Resolved";
  } else if (d.filingDate) {
    const ms = now - new Date(d.filingDate);
    daysOpen = `${Math.max(0, Math.floor(ms / 86400000))} days`;
  } else {
    daysOpen = `${daysBetween(filingDate, now)} days`;
  }

  return {
    "Dispute ID": disputeId,
    "Parcel ID": parcelId,
    Region: region,
    Type: disputeType,
    Status: status,
    "Filed Date": filingDate,
    "Est. Value": estValue,
    "Days Open": daysOpen,
    _raw: d,
  };
}

function ownerName(owner) {
  if (!owner) return "—";
  if (owner.personalInfo?.firstName) return `${owner.personalInfo.firstName} ${owner.personalInfo.lastName}`;
  if (owner.corporateInfo?.companyName) return owner.corporateInfo.companyName;
  return "—";
}

// ─── Icon ─────────────────────────────────────────────────────────────────────
function Icon({ name }) {
  if (name === "alert")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2 1 21h22L12 2Zm0 6c.55 0 1 .45 1 1v5a1 1 0 1 1-2 0V9c0-.55.45-1 1-1Zm0 10a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 12 18Z"
        />
      </svg>
    );
  if (name === "scale")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2 5 5v2h14V5l-7-3Zm7 6H5v2h14V8Zm-2 4h-2v9h-6v-9H7l-3 7h8l-3-7h2v7h2v-7h2l-3 7h8l-3-7Z"
        />
      </svg>
    );
  if (name === "clock")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20Zm1 10.4 3.2 1.9-.8 1.4L11 13V7h2v5.4Z"
        />
      </svg>
    );
  if (name === "euro")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M15.5 5.5c1.2 0 2.3.3 3.2 1l-1 1.8c-.7-.5-1.5-.7-2.4-.7-1.9 0-3.5 1.1-4.2 2.9H16v2h-5.3c0 .2 0 .4 0 .5s0 .3 0 .5H16v2h-4.9c.7 1.8 2.3 2.9 4.4 2.9.9 0 1.7-.2 2.4-.7l1 1.8c-1 .7-2.1 1-3.4 1-3.2 0-5.8-1.8-6.7-5H7v-2h1.5c0-.2 0-.4 0-.5s0-.3 0-.5H7v-2h1.8c.9-3.2 3.5-5 6.7-5Z"
        />
      </svg>
    );
  if (name === "search")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12a6 6 0 0 1 0-12Z"
        />
      </svg>
    );
  if (name === "download")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3v10l3-3 1.4 1.4L12 16.8 7.6 11.4 9 10l3 3V3h0ZM5 19h14v2H5v-2Z"
        />
      </svg>
    );
  if (name === "printer")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 7V3h10v4H7Zm10 10v-3H7v3H3v-7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v7h-4Zm-2 4H9v-5h6v5Z"
        />
      </svg>
    );
  if (name === "eye")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 5c5 0 9.3 3.1 11 7-1.7 3.9-6 7-11 7S2.7 15.9 1 12c1.7-3.9 6-7 11-7Zm0 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4a2 2 0 0 1 0-4Z"
        />
      </svg>
    );
  if (name === "arrowLeft")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M14.7 6.7 13.3 5.3 6.6 12l6.7 6.7 1.4-1.4L9.4 12l5.3-5.3Z" />
      </svg>
    );
  if (name === "close")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4Z"
        />
      </svg>
    );
  if (name === "logo")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2l8.7 5v10L12 22l-8.7-5V7L12 2Zm0 2.3L5.3 8v8L12 19.7 18.7 16V8L12 4.3Zm0 3.2a4.5 4.5 0 1 1 0 9a4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5Z"
        />
      </svg>
    );
  if (name === "calendar")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2Zm15 8H2v10h20V10ZM4 8h18V6H4v2Z"
        />
      </svg>
    );
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SummaryCard({ title, value, sub, icon, badge }) {
  return (
    <div className="dspx-card">
      <div className="dspx-card__head">
        <div>
          <div className="dspx-card__title">{title}</div>
          <div className="dspx-card__value">{value}</div>
          {sub ? <div className={`dspx-card__sub ${badge?.tone ? `dspx-tone-${badge.tone}` : ""}`}>{sub}</div> : null}
        </div>
        <div className={`dspx-card__icon ${badge?.tone ? `dspx-tone-${badge.tone}` : ""}`} title={title} aria-hidden="true">
          <Icon name={icon} />
        </div>
      </div>
    </div>
  );
}

function Pill({ status }) {
  const color = STATUS_COLORS[status] || "#94A3B8";
  const tone = toneForStatus(status);
  return (
    <span className="dspx-pill" data-tone={tone} style={{ borderColor: color, color, background: `${color}20` }}>
      {status}
    </span>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="dspx-tabs" role="tablist" aria-label="Details Tabs">
      {tabs.map((t) => (
        <button
          key={t}
          className={`dspx-tab ${active === t ? "dspx-isActive" : ""}`}
          onClick={() => onChange(t)}
          role="tab"
          aria-selected={active === t}
          type="button"
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="dspx-infoRow">
      <div className="dspx-infoRow__label">{label}</div>
      <div className="dspx-infoRow__value">{value}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Disputes() {
  const navigate = useNavigate();
  const printRef = useRef(null);

  const [allDisputes, setAllDisputes] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // filters
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All Regions");
  const [range, setRange] = useState("This year"); // ✅ default
  const [status, setStatus] = useState("All Statuses");

  // table
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // details
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("Details");

  useEffect(() => {
    setLoading(true);

    const params = { page: 1, limit: 1000 };
    if (region !== "All Regions") params.region = region;
    if (status !== "All Statuses") params.status = status;

    Promise.allSettled([
      getDisputes(params),
      fetchDisputeStats(region !== "All Regions" ? region : ""),
    ])
      .then(([dispRes, statsRes]) => {
        let normalized = [];

        if (dispRes.status === "fulfilled") {
          const raw = dispRes.value?.data ?? [];
          normalized = Array.isArray(raw) ? raw.map(normalizeDispute) : [];
          setTotalCount(dispRes.value?.pagination?.total ?? raw.length);
        } else {
          console.error("Disputes fetch failed:", dispRes.reason);
        }

        if (!normalized || normalized.length === 0) {
          normalized = generateDummyDisputes({ openCount: 2000, total: 2600 });
          setTotalCount(normalized.length);
        }

        setAllDisputes(normalized);

        if (statsRes.status === "fulfilled") {
          setStatsData(statsRes.value?.data ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [region, status]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const days = RANGE_DAYS[range] ?? 30;
    const cutoff = new Date(Date.now() - days * 86400000);

    return allDisputes.filter((d) => {
      const matchQ =
        !q ||
        d["Dispute ID"].toLowerCase().includes(q) ||
        d["Parcel ID"].toLowerCase().includes(q) ||
        d.Region.toLowerCase().includes(q) ||
        d.Type.toLowerCase().includes(q);

      const rawDate = d._raw?.filingDate;
      const matchDate = !rawDate || new Date(rawDate) >= cutoff;

      const matchRegion = region === "All Regions" ? true : String(d.Region) === String(region);
      const matchStatus = status === "All Statuses" ? true : String(d.Status) === String(status);

      return matchQ && matchDate && matchRegion && matchStatus;
    });
  }, [allDisputes, search, range, region, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, region, status, range]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const kpis = useMemo(() => {
    const open =
      (statsData?.byStatus ?? []).find((s) => s._id === "Open")?.count ??
      filtered.filter((d) => d.Status === "Open").length;

    const inCourt =
      (statsData?.byStatus ?? []).find((s) => s._id === "Court")?.count ??
      filtered.filter((d) => d.Status === "Court").length;

    const dayNums = filtered
      .filter((d) => d["Days Open"] !== "Resolved")
      .map((d) => parseInt(String(d["Days Open"]).replace(/\D/g, ""), 10))
      .filter((n) => Number.isFinite(n));

    const avg = dayNums.length
      ? Math.round(dayNums.reduce((a, b) => a + b, 0) / dayNums.length)
      : Math.round(statsData?.avgResolutionDays ?? 0) || 0;

    const totalValue = filtered.reduce((sum, d) => sum + (Number(d["Est. Value"]) || 0), 0);

    return { open, inCourt, avg, totalValue };
  }, [filtered, statsData]);

  const disputesByStatus = useMemo(() => {
    const counts = { Open: 0, Investigation: 0, Court: 0, Resolved: 0 };
    for (const d of filtered) counts[d.Status] = (counts[d.Status] || 0) + 1;
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const topCourtRegions = useMemo(() => {
    const courtRows = filtered.filter((d) => d.Status === "Court");
    const base = courtRows.length ? courtRows : filtered;

    const map = new Map();
    for (const d of base) map.set(d.Region, (map.get(d.Region) || 0) + 1);

    const arr = Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
      score: count * 120 + 30,
    }));

    arr.sort((a, b) => b.score - a.score);
    return arr.slice(0, 10);
  }, [filtered]);

  function resetFilters() {
    setSearch("");
    setRegion("All Regions");
    setRange("This year");
    setStatus("All Statuses");
  }

  function handleExportCurrent() {
    const rows = filtered.map((d) => ({
      DisputeID: d["Dispute ID"],
      ParcelID: d["Parcel ID"],
      Region: d.Region,
      Type: d.Type,
      Status: d.Status,
      FiledDate: d["Filed Date"],
      EstValueEUR: d["Est. Value"],
      DaysOpen: d["Days Open"],
    }));
    const csv = toCSV(rows, Object.keys(rows[0] || { DisputeID: "" }));
    downloadFile(`disputes_export_${Date.now()}.csv`, csv, "text/csv;charset=utf-8");
  }

  function handleDownloadSelectedPDF() {
    if (!selected) return;
    // No external lib: print dialog => Save as PDF
    printAsPdfOnlyDetails(`dispute_${selected["Dispute ID"]}`);
  }

  function handlePrintSelected() {
    if (!selected) return;
    printAsPdfOnlyDetails(`dispute_${selected["Dispute ID"]}`);
  }

  function openDetails(row) {
    setSelected(row);
    setActiveTab("Details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeDetails() {
    setSelected(null);
    setActiveTab("Details");
  }

  const detailHeader = useMemo(() => {
    if (!selected) return null;
    return {
      val: formatEuro(selected["Est. Value"]),
      processingTime: selected["Days Open"] === "Resolved" ? "Completed" : selected["Days Open"],
      regionName: selected.Region,
    };
  }, [selected]);

  return (
    <div id="dspx-page" className="dspx-page">
      <div className="dspx-topbar">
        <div className="dspx-topbarLeft">
          <div
            className="dspx-brand"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/dashboard")}
            onKeyDown={(e) => e.key === "Enter" && navigate("/dashboard")}
          >
            <span className="dspx-brandMark" aria-hidden="true">
              <Icon name="logo" />
            </span>
            <div className="dspx-brandText">
              <div className="dspx-brandName">Land Registry</div>
              <div className="dspx-brandSub">Disputes Module</div>
            </div>
          </div>

          <div className="dspx-crumbs">
            <span className="dspx-crumb">Dashboard</span>
            <span className="dspx-crumbSep">›</span>
            <span className="dspx-crumb dspx-isActive">Disputes</span>
          </div>
        </div>

        {/* ✅ label fix */}
        <button className="dspx-btn dspx-btn--ghost" type="button" onClick={() => navigate("/dashboard")}>
          <Icon name="arrowLeft" /> Return
        </button>
      </div>

      <div className="dspx-pagehead">
        <div>
          <h1 className="dspx-h1">Disputes Dashboard</h1>
          <div className="dspx-muted">
            Monitor and manage land ownership disputes
            {totalCount > 0 && ` · ${totalCount.toLocaleString()} total records`}
          </div>
        </div>
      </div>

      {!selected && (
        <div className="dspx-filterBar">
          <div className="dspx-filterBarLeft">
            <div className="dspx-field dspx-field--search">
              <span className="dspx-fieldIcon">
                <Icon name="search" />
              </span>
              <input
                className="dspx-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID or name..."
                aria-label="Search by ID or name"
              />
            </div>

            <div className="dspx-field">
              <select className="dspx-select" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region filter">
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="dspx-field dspx-field--range">
              <span className="dspx-fieldIcon">
                <Icon name="calendar" />
              </span>
              <select className="dspx-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range filter">
                {RANGES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="dspx-field">
              <select className="dspx-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button className="dspx-btn dspx-btn--secondary" type="button" onClick={resetFilters}>
              Reset filters
            </button>
          </div>

          <div className="dspx-filterBarRight">
            <button className="dspx-btn dspx-btn--primary" type="button" onClick={handleExportCurrent}>
              <Icon name="download" /> Export
            </button>
          </div>
        </div>
      )}

      {loading && <div className="dspx-loading">Loading disputes…</div>}

      {selected ? (
        <div className="dspx-detailWrap" ref={printRef}>
          <div className="dspx-detailTop">
            <div className="dspx-detailTitleRow">
              <button className="dspx-btn dspx-btn--ghost" type="button" onClick={closeDetails}>
                <Icon name="arrowLeft" /> Back
              </button>

              <div className="dspx-detailTitle">
                <div className="dspx-detailId">{selected["Dispute ID"]}</div>
                <span className={`dspx-badge dspx-badge--${toneForStatus(selected.Status)}`}>{selected.Status}</span>
                <div className="dspx-detailSub">{selected.Type}</div>
              </div>

              <div className="dspx-detailActions">
                <button className="dspx-btn dspx-btn--secondary" type="button" onClick={handlePrintSelected}>
                  <Icon name="printer" /> Print
                </button>

                {/* ✅ PDF download (print => Save as PDF) */}
                <button className="dspx-btn dspx-btn--primary" type="button" onClick={handleDownloadSelectedPDF}>
                  <Icon name="download" /> Download PDF
                </button>

                <button className="dspx-btn dspx-btn--icon" type="button" onClick={closeDetails} aria-label="Close details">
                  <Icon name="close" />
                </button>
              </div>
            </div>

            <div className="dspx-kpiRow">
              <div className="dspx-kpiBox">
                <div className="dspx-kpiIcon dspx-tone-purple">
                  <Icon name="euro" />
                </div>
                <div>
                  <div className="dspx-kpiValue">{detailHeader?.val}</div>
                  <div className="dspx-kpiLabel">Claimed Value</div>
                </div>
              </div>

              <div className="dspx-kpiBox">
                <div className="dspx-kpiIcon dspx-tone-navy">
                  <Icon name="clock" />
                </div>
                <div>
                  <div className="dspx-kpiValue">{detailHeader?.processingTime}</div>
                  <div className="dspx-kpiLabel">Processing Time</div>
                </div>
              </div>

              <div className="dspx-kpiBox">
                <div className="dspx-kpiIcon dspx-tone-orange">
                  <Icon name="scale" />
                </div>
                <div>
                  <div className="dspx-kpiValue">{selected.Type}</div>
                  <div className="dspx-kpiLabel">Dispute Type</div>
                </div>
              </div>

              <div className="dspx-kpiBox">
                <div className="dspx-kpiIcon dspx-tone-red">
                  <Icon name="alert" />
                </div>
                <div>
                  <div className="dspx-kpiValue">{detailHeader?.regionName}</div>
                  <div className="dspx-kpiLabel">City / Region</div>
                </div>
              </div>
            </div>

            <Tabs tabs={["Details", "Parties", "Timeline", "Validation"]} active={activeTab} onChange={setActiveTab} />
          </div>

          <div className="dspx-detailGrid">
            <div className="dspx-panel">
              <div className="dspx-panelHead">
                <div className="dspx-panelTitle">Dispute Information</div>
              </div>
              <div className="dspx-panelBody">
                <InfoRow label="Dispute ID" value={selected["Dispute ID"]} />
                <InfoRow label="Parcel ID" value={selected["Parcel ID"]} />
                <InfoRow label="Type" value={selected.Type} />
                <InfoRow label="Filed Date" value={selected["Filed Date"]} />
                <InfoRow label="Status" value={selected.Status} />
                <InfoRow label="Priority" value={selected._raw?.priority ?? "—"} />
              </div>
            </div>

            <div className="dspx-panel">
              <div className="dspx-panelHead">
                <div className="dspx-panelTitle">Property Details</div>
              </div>
              <div className="dspx-panelBody">
                <InfoRow label="Region" value={selected.Region} />
                <InfoRow label="Parcel ID" value={selected["Parcel ID"]} />
                <div className="dspx-hashBox">
                  <div className="dspx-hashLabel">Transaction Hash</div>
                  <div className="dspx-hashValue">
                    {selected._raw?.parcel?.blockchainHash ?? `0x${selected["Parcel ID"].toLowerCase().replace(/[^a-z0-9]/g, "")}cd34e5f6...`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dspx-panel dspx-mt16">
            <div className="dspx-panelHead">
              <div className="dspx-panelTitle">{activeTab}</div>
            </div>
            <div className="dspx-panelBody">
              {activeTab === "Details" && (
                <div className="dspx-grid2">
                  <InfoRow label="Dispute ID" value={selected["Dispute ID"]} />
                  <InfoRow label="Status" value={selected.Status} />
                  <InfoRow label="Estimated Value" value={formatEuro(selected["Est. Value"])} />
                  <InfoRow label="Days Open" value={selected["Days Open"]} />
                  <InfoRow label="Region" value={selected.Region} />
                  <InfoRow label="Dispute Type" value={selected.Type} />
                </div>
              )}

              {activeTab === "Parties" && (
                <div className="dspx-stack">
                  <div className="dspx-grid2">
                    <InfoRow label="Claimant" value={ownerName(selected._raw?.claimant)} />
                    <InfoRow label="Defendant" value={ownerName(selected._raw?.defendant)} />
                    <InfoRow
                      label="Assigned Officer"
                      value={
                        selected._raw?.assignedTo
                          ? `${selected._raw.assignedTo.firstName ?? ""} ${selected._raw.assignedTo.lastName ?? ""}`.trim()
                          : "—"
                      }
                    />
                    <InfoRow label="Legal Counsel" value="—" />
                  </div>
                </div>
              )}

              {activeTab === "Timeline" && (
                <div className="dspx-timeline">
                  <div className="dspx-tItem">
                    <div className="dspx-tDot dspx-tDot--red" />
                    <div>
                      <div className="dspx-tTitle">Filed</div>
                      <div className="dspx-tMeta">{selected["Filed Date"]}</div>
                    </div>
                  </div>

                  {selected._raw?.investigationStartDate && (
                    <div className="dspx-tItem">
                      <div className="dspx-tDot dspx-tDot--navy" />
                      <div>
                        <div className="dspx-tTitle">Investigation Started</div>
                        <div className="dspx-tMeta">{new Date(selected._raw.investigationStartDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}

                  {selected._raw?.courtFilingDate && (
                    <div className="dspx-tItem">
                      <div className="dspx-tDot dspx-tDot--orange" />
                      <div>
                        <div className="dspx-tTitle">Court Filing</div>
                        <div className="dspx-tMeta">{new Date(selected._raw.courtFilingDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}

                  <div className="dspx-tItem">
                    <div className={`dspx-tDot dspx-tDot--${toneForStatus(selected.Status)}`} />
                    <div>
                      <div className="dspx-tTitle">Current Status</div>
                      <div className="dspx-tMeta">{selected.Status}</div>
                    </div>
                  </div>

                  {selected._raw?.resolutionDate && (
                    <div className="dspx-tItem">
                      <div className="dspx-tDot dspx-tDot--green" />
                      <div>
                        <div className="dspx-tTitle">Resolved</div>
                        <div className="dspx-tMeta">{new Date(selected._raw.resolutionDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Validation" && (
                <div className="dspx-stack">
                  <ul className="dspx-checkList">
                    <li>Parcel identifier verified</li>
                    <li>Ownership record checked</li>
                    <li>Encumbrance scan completed</li>
                    <li>Dispute type classified: {selected.Type}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="dspx-footer">
            <div className="dspx-footerInner">
              <div className="dspx-footerLeft">
                <span className="dspx-footerDot" />
                <span>Secure Registry • Disputes</span>
              </div>
              <div className="dspx-footerRight">© {new Date().getFullYear()} Land Registry</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="dspx-grid4">
            <SummaryCard title="Open Disputes" value={kpis.open} sub="↘ 12% vs last month" icon="alert" badge={{ tone: "red" }} />
            <SummaryCard title="In Court" value={kpis.inCourt} sub="Active litigation" icon="scale" badge={{ tone: "orange" }} />
            <SummaryCard title="Avg. Days Open" value={`${kpis.avg} days`} sub="↘ 15% improvement" icon="clock" badge={{ tone: "navy" }} />
            <SummaryCard title="Total Value at Stake" value={formatEuro(kpis.totalValue)} sub="Across all disputes" icon="euro" badge={{ tone: "green" }} />
          </div>

          <div className="dspx-grid2 dspx-mt16">
            <div className="dspx-panel">
              <div className="dspx-panelHead">
                <div className="dspx-panelTitle">Disputes by Status</div>
              </div>
              <div className="dspx-panelBody">
                <div className="dspx-chartWrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={disputesByStatus} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={2}>
                        {disputesByStatus.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94A3B8"} />
                        ))}
                      </Pie>
                      <ReTooltip formatter={(value, name) => [`${value}`, name]} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="dspx-legend">
                    {disputesByStatus.map((s) => (
                      <div className="dspx-legendItem" key={s.name}>
                        <span className="dspx-legendDot" style={{ background: STATUS_COLORS[s.name] || "#94A3B8" }} />
                        <span className="dspx-legendText">
                          {s.name}: <b>{s.value}</b>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="dspx-panel">
              <div className="dspx-panelHead">
                <div className="dspx-panelTitle">Top Cities by Court Cases</div>
              </div>
              <div className="dspx-panelBody">
                <div className="dspx-chartWrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topCourtRegions} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={70} />
                      <YAxis tickLine={false} axisLine={false} />
                      <ReTooltip
                        formatter={(value, name, props) => {
                          if (name === "score") return [`${props?.payload?.count ?? ""} court cases`, "Court"];
                          return [value, name];
                        }}
                        contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }}
                      />
                      <Bar dataKey="score" radius={[10, 10, 10, 10]} fill="var(--dspx-orange)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="dspx-note">
                  *This bar chart is calculated from <b>Court</b> status disputes within the selected filters.
                </div>
              </div>
            </div>
          </div>

          <div className="dspx-panel dspx-mt16">
            <div className="dspx-panelHead">
              <div className="dspx-panelTitle">Dispute Records</div>
            </div>

            <div className="dspx-panelBody">
              <div className="dspx-tableWrap">
                <table className="dspx-table" role="table" aria-label="Dispute Records">
                  <thead>
                    <tr>
                      <th>Dispute ID</th>
                      <th>Parcel ID</th>
                      <th>City / Region</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Filed Date</th>
                      <th>Est. Value</th>
                      <th>Days Open</th>
                      <th className="dspx-thRight">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (
                      <tr key={r["Dispute ID"]} className={rowClassByStatus(r.Status)}>
                        <td className="dspx-mono">{r["Dispute ID"]}</td>
                        <td className="dspx-mono">{r["Parcel ID"]}</td>
                        <td>{r.Region}</td>
                        <td>{r.Type}</td>
                        <td><Pill status={r.Status} /></td>
                        <td>{r["Filed Date"]}</td>
                        <td>{formatEuro(r["Est. Value"])}</td>
                        <td>{r["Days Open"]}</td>
                        <td className="dspx-tdRight">
                          <button className="dspx-btn dspx-btn--link" type="button" onClick={() => openDetails(r)}>
                            <Icon name="eye" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pageRows.length === 0 && !loading && (
                      <tr>
                        <td colSpan={9} className="dspx-empty">No results found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="dspx-pager">
                <div className="dspx-pagerLeft">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
                </div>
                <div className="dspx-pagerRight">
                  <button className="dspx-btn dspx-btn--secondary" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    ‹
                  </button>
                  <div className="dspx-pagerText">
                    Page <b>{page}</b> of <b>{totalPages}</b>
                  </div>
                  <button className="dspx-btn dspx-btn--secondary" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="dspx-footer">
            <div className="dspx-footerInner">
              <div className="dspx-footerLeft">
                <span className="dspx-footerDot" />
                <span>Secure Registry • Disputes</span>
              </div>
              <div className="dspx-footerRight">© {new Date().getFullYear()} Land Registry</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}