// Mortgages.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./Mortgages.css";
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

const YM_MORT_PAGE_ID = "ym-mortgages-page";

const STATUS_META = {
  Active: { pillClass: "ym-mort-pill ym-mort-pill--active" },
  Paid: { pillClass: "ym-mort-pill ym-mort-pill--paid" },
  Defaulted: { pillClass: "ym-mort-pill ym-mort-pill--defaulted" },
  Foreclosure: { pillClass: "ym-mort-pill ym-mort-pill--foreclosure" },
};

// ✅ 4 different colors requested: red, green, orange, blue
const PIE_COLORS = ["#ef4444", "#22c55e", "#f97316", "#3b82f6"];

const formatEUR = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
};

const parseDmy = (dmy) => {
  if (!dmy) return null;
  const cleaned = String(dmy).replace(/\s/g, "").replace(/\.$/, "");
  const parts = cleaned.split(".");
  if (parts.length < 3) return null;
  const dd = Number(parts[0]);
  const mm = Number(parts[1]) - 1;
  const yy = Number(parts[2]);
  const dt = new Date(yy, mm, dd);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const withinRange = (dateObj, daysBack) => {
  if (!dateObj) return false;
  const now = new Date();
  const from = new Date();
  from.setDate(now.getDate() - daysBack);
  return dateObj >= from && dateObj <= now;
};

const downloadTextFile = (filename, text, mime = "text/plain;charset=utf-8") => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const toCsv = (rows) => {
  const headers = [
    "Mortgage ID",
    "Parcel ID",
    "Region",
    "Bank",
    "Status",
    "Original Amount",
    "Remaining",
    "Monthly",
    "Start Date",
  ];
  const esc = (v) => {
    const s = String(v ?? "");
    if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.mortgageId,
        r.parcelId,
        r.region,
        r.bank,
        r.status,
        r.originalAmount,
        r.remaining,
        r.monthly ?? "",
        r.startDate,
      ]
        .map(esc)
        .join(",")
    ),
  ].join("\n");
};

const YmMortTooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  const name = payload[0]?.name || payload[0]?.dataKey || "Value";
  return (
    <div className="ym-mort-tooltip" role="tooltip">
      <div className="ym-mort-tooltip__title">{label}</div>
      <div className="ym-mort-tooltip__row">
        <span className="ym-mort-tooltip__dot" />
        <span className="ym-mort-tooltip__kv">
          {name}: <strong>{v}</strong>
        </span>
      </div>
    </div>
  );
};

// ✅ optional: parent can pass onBack, otherwise it will go back in browser history
export default function Mortgages({ onBack }) {
  const [ymMortData] = useState([
    {
      mortgageId: "MTG-2024-001",
      parcelId: "BEL-11111",
      region: "Belgrade",
      bank: "Banca Intesa",
      status: "Active",
      originalAmount: 150000,
      remaining: 125000,
      monthly: 1250,
      startDate: "15. 3. 2022.",
    },
    {
      mortgageId: "MTG-2024-002",
      parcelId: "VOJ-22222",
      region: "Vojvodina",
      bank: "Erste Bank",
      status: "Active",
      originalAmount: 85000,
      remaining: 62000,
      monthly: 780,
      startDate: "20. 6. 2021.",
    },
    {
      mortgageId: "MTG-2024-003",
      parcelId: "BEL-33333",
      region: "Belgrade",
      bank: "UniCredit",
      status: "Active",
      originalAmount: 320000,
      remaining: 305000,
      monthly: 2800,
      startDate: "10. 1. 2023.",
    },
    {
      mortgageId: "MTG-2024-004",
      parcelId: "SUM-44444",
      region: "Šumadija",
      bank: "Komercijalna Banka",
      status: "Paid",
      originalAmount: 95000,
      remaining: 0,
      monthly: null,
      startDate: "12. 5. 2018.",
    },
    {
      mortgageId: "MTG-2024-005",
      parcelId: "NIS-55555",
      region: "Nišava",
      bank: "AIK Banka",
      status: "Defaulted",
      originalAmount: 45000,
      remaining: 38000,
      monthly: 520,
      startDate: "1. 9. 2020.",
    },
    {
      mortgageId: "MTG-2024-006",
      parcelId: "ZLA-66666",
      region: "Zlatibor",
      bank: "Raiffeisen",
      status: "Active",
      originalAmount: 180000,
      remaining: 165000,
      monthly: 1650,
      startDate: "20. 11. 2022.",
    },
    {
      mortgageId: "MTG-2024-007",
      parcelId: "VOJ-77777",
      region: "Vojvodina",
      bank: "OTP Banka",
      status: "Active",
      originalAmount: 220000,
      remaining: 215000,
      monthly: 1980,
      startDate: "5. 4. 2023.",
    },
    {
      mortgageId: "MTG-2024-008",
      parcelId: "BEL-88888",
      region: "Belgrade",
      bank: "Banca Intesa",
      status: "Foreclosure",
      originalAmount: 450000,
      remaining: 380000,
      monthly: 4200,
      startDate: "15. 8. 2019.",
    },
    {
      mortgageId: "MTG-2024-009",
      parcelId: "POD-99999",
      region: "Podunavlje",
      bank: "Erste Bank",
      status: "Active",
      originalAmount: 65000,
      remaining: 52000,
      monthly: 680,
      startDate: "1. 7. 2022.",
    },
    {
      mortgageId: "MTG-2024-010",
      parcelId: "KOL-10101",
      region: "Kolubara",
      bank: "UniCredit",
      status: "Active",
      originalAmount: 110000,
      remaining: 85000,
      monthly: 1100,
      startDate: "10. 12. 2021.",
    },
  ]);

  const [ymMortSearch, setYmMortSearch] = useState("");
  const [ymMortRegion, setYmMortRegion] = useState("All Regions");
  const [ymMortStatus, setYmMortStatus] = useState("All Statuses");
  const [ymMortDateRange, setYmMortDateRange] = useState("All time");
  const [ymMortSelectedRow, setYmMortSelectedRow] = useState(null);

  const ymMortRegions = useMemo(() => {
    const set = new Set(ymMortData.map((d) => d.region));
    return ["All Regions", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [ymMortData]);

  const ymMortStatuses = useMemo(() => ["All Statuses", ...Object.keys(STATUS_META)], []);

  const ymMortDateRanges = useMemo(
    () => [
      { label: "Last 7 days", days: 7 },
      { label: "Last 30 days", days: 30 },
      { label: "Last 90 days", days: 90 },
      { label: "All time", days: null },
    ],
    []
  );

  const ymMortFiltered = useMemo(() => {
    const q = ymMortSearch.trim().toLowerCase();
    const rangeObj = ymMortDateRanges.find((d) => d.label === ymMortDateRange) || ymMortDateRanges[3];

    return ymMortData.filter((r) => {
      const matchesSearch =
        !q ||
        r.mortgageId.toLowerCase().includes(q) ||
        r.parcelId.toLowerCase().includes(q) ||
        r.bank.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q);

      const matchesRegion = ymMortRegion === "All Regions" || r.region === ymMortRegion;
      const matchesStatus = ymMortStatus === "All Statuses" || r.status === ymMortStatus;

      const dt = parseDmy(r.startDate);
      const matchesDate = rangeObj.days == null ? true : withinRange(dt, rangeObj.days);

      return matchesSearch && matchesRegion && matchesStatus && matchesDate;
    });
  }, [ymMortData, ymMortSearch, ymMortRegion, ymMortStatus, ymMortDateRange, ymMortDateRanges]);

  const ymMortKpis = useMemo(() => {
    const active = ymMortFiltered.filter((r) => r.status === "Active");
    const atRisk = ymMortFiltered.filter((r) => r.status === "Defaulted" || r.status === "Foreclosure");
    const totalRegistered = ymMortFiltered.reduce((s, r) => s + (r.originalAmount || 0), 0);
    const outstandingActive = active.reduce((s, r) => s + (r.remaining || 0), 0);

    return {
      activeCount: active.length,
      atRiskCount: atRisk.length,
      totalRegistered,
      outstandingActive,
      trendPct: 3.5,
    };
  }, [ymMortFiltered]);

  const ymMortStatusChart = useMemo(() => {
    const counts = { Active: 0, Paid: 0, Defaulted: 0, Foreclosure: 0 };
    for (const r of ymMortFiltered) counts[r.status] = (counts[r.status] || 0) + 1;
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [ymMortFiltered]);

  // ✅ FIXED syntax error here
  const ymMortBankChart = useMemo(() => {
    const map = new Map();
    for (const r of ymMortFiltered) {
      map.set(r.bank, (map.get(r.bank) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([bank, count]) => ({ bank, count }))
      .sort((a, b) => b.count - a.count);
  }, [ymMortFiltered]);

  const ymMortResetFilters = () => {
    setYmMortSearch("");
    setYmMortRegion("All Regions");
    setYmMortStatus("All Statuses");
    setYmMortDateRange("All time");
  };

  const ymMortExportCsv = () => {
    downloadTextFile("mortgages_export.csv", toCsv(ymMortFiltered), "text/csv;charset=utf-8");
  };

  const ymMortGoBack = () => {
    if (typeof onBack === "function") return onBack();
    window.history.back();
  };

  const ymMortPrint = () => window.print();

  // ✅ Dispute logic: Defaulted / Foreclosure = dispute (red), otherwise OK (green)
  const isDispute = (status) => status === "Defaulted" || status === "Foreclosure";

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setYmMortSelectedRow(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div id={YM_MORT_PAGE_ID} className="ym-mort-page">
      {/* ✅ Header like reference */}
      <header className="ym-mort-hero">
        <div className="ym-mort-hero__top">
          <div className="ym-mort-crumbs" aria-label="Breadcrumb">
            <span className="ym-mort-crumb">Dashboard</span>
            <span className="ym-mort-crumb-sep">›</span>
            <span className="ym-mort-crumb ym-mort-crumb--active">Mortgages</span>
          </div>

          <button type="button" className="ym-mort-btn ym-mort-btn--back" onClick={ymMortGoBack}>
            ← <span className="ym-mort-btn__txt">Return</span>
          </button>
        </div>

        <div className="ym-mort-hero__titles">
          <h1 className="ym-mort-title">Mortgages Dashboard</h1>
          <p className="ym-mort-subtitle">Monitor registered mortgages and encumbrances</p>
        </div>

        <div className="ym-mort-hero__actions">
          <button type="button" className="ym-mort-btn ym-mort-btn--ghost" onClick={ymMortPrint}>
            🖨 <span className="ym-mort-btn__txt">Print</span>
          </button>
          <button type="button" className="ym-mort-btn ym-mort-btn--primary" onClick={ymMortExportCsv}>
            ⬇ <span className="ym-mort-btn__txt">Export</span>
          </button>
        </div>
      </header>

      {/* ✅ Filters after dashboard like reference */}
      <section className="ym-mort-filterbar ym-mort-card">
        <div className="ym-mort-filterbar__head">
          <div className="ym-mort-filterbar__title">
            <span className="ym-mort-filterbar__icon">⎇</span>
            Filters
          </div>
          <button type="button" className="ym-mort-btn ym-mort-btn--ghost" onClick={ymMortResetFilters}>
            ✕ <span className="ym-mort-btn__txt">Reset filters</span>
          </button>
        </div>

        <div className="ym-mort-filterbar__row">
          <div className="ym-mort-inputwrap ym-mort-inputwrap--search">
            <span className="ym-mort-inputicon">🔎</span>
            <input
              className="ym-mort-input ym-mort-input--top"
              placeholder="Search by ID or name..."
              value={ymMortSearch}
              onChange={(e) => setYmMortSearch(e.target.value)}
              aria-label="Search mortgages"
            />
          </div>

          <div className="ym-mort-selectwrap">
            <select
              className="ym-mort-select ym-mort-select--top"
              value={ymMortRegion}
              onChange={(e) => setYmMortRegion(e.target.value)}
              aria-label="Region"
            >
              {ymMortRegions.map((r) => (
                <option key={`ym-mort-region-${r}`} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="ym-mort-selectwrap">
            <select
              className="ym-mort-select ym-mort-select--top"
              value={ymMortDateRange}
              onChange={(e) => setYmMortDateRange(e.target.value)}
              aria-label="Date range"
            >
              {ymMortDateRanges.map((r) => (
                <option key={`ym-mort-range-${r.label}`} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ym-mort-selectwrap">
            <select
              className="ym-mort-select ym-mort-select--top"
              value={ymMortStatus}
              onChange={(e) => setYmMortStatus(e.target.value)}
              aria-label="Status"
            >
              {ymMortStatuses.map((s) => (
                <option key={`ym-mort-status-${s}`} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="ym-mort-filterbar__miniLegend" aria-label="Dispute legend">
            <span className="ym-mort-chip ym-mort-chip--ok">Not Dispute</span>
            <span className="ym-mort-chip ym-mort-chip--bad">Dispute</span>
          </div>
        </div>
      </section>

      <main className="ym-mort-wrap">
        {/* KPIs */}
        <section className="ym-mort-kpis" aria-label="KPIs">
          <div className="ym-mort-kpi">
            <div className="ym-mort-kpi__row">
              <div className="ym-mort-kpi__label">Active Mortgages</div>
              <div className="ym-mort-kpi__icon ym-mort-kpi__icon--doc">▦</div>
            </div>
            <div className="ym-mort-kpi__value">{ymMortKpis.activeCount}</div>
            <div className="ym-mort-kpi__hint">
              <span className="ym-mort-trend ym-mort-trend--up">~ {ymMortKpis.trendPct}%</span>{" "}
              <span className="ym-mort-muted">vs last month</span>
            </div>
          </div>

          <div className="ym-mort-kpi ym-mort-kpi--danger">
            <div className="ym-mort-kpi__row">
              <div className="ym-mort-kpi__label">At Risk</div>
              <div className="ym-mort-kpi__icon ym-mort-kpi__icon--alert">⚠</div>
            </div>
            <div className="ym-mort-kpi__value ym-mort-text--bad">{ymMortKpis.atRiskCount}</div>
            <div className="ym-mort-kpi__hint ym-mort-muted">Defaulted or foreclosure</div>
          </div>

          <div className="ym-mort-kpi">
            <div className="ym-mort-kpi__row">
              <div className="ym-mort-kpi__label">Total Registered</div>
              <div className="ym-mort-kpi__icon ym-mort-kpi__icon--eur">€</div>
            </div>
            <div className="ym-mort-kpi__value">{formatEUR(ymMortKpis.totalRegistered)}</div>
            <div className="ym-mort-kpi__hint ym-mort-muted">Original mortgage value</div>
          </div>

          <div className="ym-mort-kpi">
            <div className="ym-mort-kpi__row">
              <div className="ym-mort-kpi__label">Outstanding Balance</div>
              <div className="ym-mort-kpi__icon ym-mort-kpi__icon--money">💳</div>
            </div>
            <div className="ym-mort-kpi__value">{formatEUR(ymMortKpis.outstandingActive)}</div>
            <div className="ym-mort-kpi__hint ym-mort-muted">Active mortgages</div>
          </div>
        </section>

        {/* Charts */}
        <section className="ym-mort-charts" aria-label="Charts">
          <div className="ym-mort-card">
            <div className="ym-mort-card__title">Mortgages by Status</div>
            <div className="ym-mort-card__body ym-mort-card__body--chart">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={ymMortStatusChart}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={74}
                    outerRadius={104}
                    paddingAngle={2}
                    stroke="transparent"
                  >
                    {ymMortStatusChart.map((entry, idx) => (
                      <Cell key={`ym-mort-pie-${entry.name}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip
                    content={({ active, payload, label }) => (
                      <YmMortTooltipBox active={active} payload={payload} label={label} />
                    )}
                  />
                  <Legend verticalAlign="bottom" height={44} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ym-mort-card">
            <div className="ym-mort-card__title">Mortgages by Bank</div>
            <div className="ym-mort-card__body ym-mort-card__body--chart">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ymMortBankChart} margin={{ top: 10, right: 16, left: 0, bottom: 14 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.14)" />
                  <XAxis
                    dataKey="bank"
                    tick={{ fontSize: 12, fill: "rgba(15, 23, 42, 0.78)" }}
                    interval={0}
                    height={68}
                    angle={-16}
                    textAnchor="end"
                  />
                  <YAxis allowDecimals={false} tick={{ fill: "rgba(15, 23, 42, 0.78)" }} />
                  <ReTooltip
                    content={({ active, payload, label }) => (
                      <YmMortTooltipBox active={active} payload={payload} label={label} />
                    )}
                  />
                  <Bar dataKey="count" name="Mortgages" radius={[10, 10, 0, 0]} fill="rgba(11, 46, 89, 0.88)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="ym-mort-card ym-mort-tablecard" aria-label="Mortgage Records">
          <div className="ym-mort-card__title ym-mort-tabletitle">
            <span className="ym-mort-tabletitle__icon">📄</span>
            Mortgage Records
            <span className="ym-mort-tabletitle__count">{ymMortFiltered.length}</span>
          </div>

          <div className="ym-mort-tablewrap">
            <table className="ym-mort-table">
              <thead>
                <tr>
                  <th>Mortgage</th>
                  <th>Parcel</th>
                  <th>Region</th>
                  <th>Bank</th>
                  <th>Status</th>
                  <th className="ym-mort-th--num">Original</th>
                  <th className="ym-mort-th--num">Remaining</th>
                  <th className="ym-mort-th--num">Monthly</th>
                  <th>Start Date</th>
                  <th className="ym-mort-th--action">Action</th>
                </tr>
              </thead>

              <tbody>
                {ymMortFiltered.map((r) => {
                  const dispute = isDispute(r.status);
                  return (
                    <tr
                      key={`ym-mort-row-${r.mortgageId}`}
                      className={dispute ? "ym-mort-row ym-mort-row--dispute" : "ym-mort-row ym-mort-row--ok"}
                    >
                      <td data-label="Mortgage" className="ym-mort-cell">
                        <div className="ym-mort-primary ym-mort-mono">{r.mortgageId}</div>
                        <div className="ym-mort-secondary">ID</div>
                      </td>

                      <td data-label="Parcel" className="ym-mort-cell">
                        <div className="ym-mort-primary ym-mort-mono">{r.parcelId}</div>
                        <div className="ym-mort-secondary">Parcel</div>
                      </td>

                      <td data-label="Region" className="ym-mort-cell">
                        <span className="ym-mort-badgeSoft">{r.region}</span>
                      </td>

                      <td data-label="Bank" className="ym-mort-cell">
                        <div className="ym-mort-primary">{r.bank}</div>
                        <div className="ym-mort-secondary">Lender</div>
                      </td>

                      <td data-label="Status" className="ym-mort-cell">
                        <div className="ym-mort-statusStack">
                          <span className={STATUS_META[r.status]?.pillClass || "ym-mort-pill"}>{r.status}</span>
                          <span className={dispute ? "ym-mort-flag ym-mort-flag--bad" : "ym-mort-flag ym-mort-flag--ok"}>
                            {dispute ? "Dispute" : "Not Dispute"}
                          </span>
                        </div>
                      </td>

                      <td data-label="Original" className="ym-mort-td--num ym-mort-cell">
                        <div className="ym-mort-primary">{formatEUR(r.originalAmount)}</div>
                      </td>

                      <td
                        data-label="Remaining"
                        className={
                          dispute
                            ? "ym-mort-td--num ym-mort-cell ym-mort-text--bad"
                            : "ym-mort-td--num ym-mort-cell ym-mort-text--ok"
                        }
                      >
                        <div className="ym-mort-primary">{formatEUR(r.remaining)}</div>
                      </td>

                      <td data-label="Monthly" className="ym-mort-td--num ym-mort-cell">
                        <div className="ym-mort-primary">{r.monthly ? formatEUR(r.monthly) : "N/A"}</div>
                      </td>

                      <td data-label="Start Date" className="ym-mort-cell">
                        <div className="ym-mort-primary">{r.startDate}</div>
                      </td>

                      <td data-label="Action" className="ym-mort-td--action ym-mort-cell">
                        <button className="ym-mort-linkbtn" onClick={() => setYmMortSelectedRow(r)}>
                          👁 <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!ymMortFiltered.length && (
                  <tr>
                    <td colSpan={10} className="ym-mort-empty">
                      No records match your filters. (Try “All time”.)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Drawer (View page enhanced + return button) */}
      <div className={`ym-mort-drawer ${ymMortSelectedRow ? "ym-mort-drawer--open" : ""}`}>
        <div className="ym-mort-drawer__backdrop" onClick={() => setYmMortSelectedRow(null)} />
        <div className="ym-mort-drawer__panel" role="dialog" aria-modal="true" aria-label="Mortgage details">
          <div className="ym-mort-drawer__head">
            <div className="ym-mort-drawer__left">
              <button
                className="ym-mort-btn ym-mort-btn--ghost ym-mort-btn--drawerBack"
                onClick={() => setYmMortSelectedRow(null)}
              >
                ← <span className="ym-mort-btn__txt">Return</span>
              </button>
              <div className="ym-mort-drawer__titleBlock">
                <div className="ym-mort-drawer__title">Mortgage Details</div>
                {ymMortSelectedRow ? (
                  <div className="ym-mort-drawer__subtitle">
                    <span className="ym-mort-mono">{ymMortSelectedRow.mortgageId}</span> •{" "}
                    <span className="ym-mort-muted">{ymMortSelectedRow.bank}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <button className="ym-mort-btn ym-mort-btn--ghost" onClick={() => setYmMortSelectedRow(null)} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="ym-mort-drawer__body">
            {ymMortSelectedRow ? (
              <>
                <div className="ym-mort-detailHero">
                  <div className="ym-mort-detailHero__row">
                    <span className={STATUS_META[ymMortSelectedRow.status]?.pillClass || "ym-mort-pill"}>
                      {ymMortSelectedRow.status}
                    </span>
                    <span
                      className={
                        isDispute(ymMortSelectedRow.status)
                          ? "ym-mort-flag ym-mort-flag--bad"
                          : "ym-mort-flag ym-mort-flag--ok"
                      }
                    >
                      {isDispute(ymMortSelectedRow.status) ? "Dispute" : "Not Dispute"}
                    </span>
                  </div>

                  <div className="ym-mort-detailHero__money">
                    <div className="ym-mort-detailHero__moneyItem">
                      <div className="ym-mort-detailHero__k">Original</div>
                      <div className="ym-mort-detailHero__v">{formatEUR(ymMortSelectedRow.originalAmount)}</div>
                    </div>
                    <div className="ym-mort-detailHero__moneyItem">
                      <div className="ym-mort-detailHero__k">Remaining</div>
                      <div
                        className={
                          isDispute(ymMortSelectedRow.status)
                            ? "ym-mort-detailHero__v ym-mort-text--bad"
                            : "ym-mort-detailHero__v ym-mort-text--ok"
                        }
                      >
                        {formatEUR(ymMortSelectedRow.remaining)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ym-mort-detailgrid">
                  {[
                    ["Mortgage ID", ymMortSelectedRow.mortgageId],
                    ["Parcel ID", ymMortSelectedRow.parcelId],
                    ["Region", ymMortSelectedRow.region],
                    ["Bank", ymMortSelectedRow.bank],
                    ["Start Date", ymMortSelectedRow.startDate],
                    ["Monthly", ymMortSelectedRow.monthly ? formatEUR(ymMortSelectedRow.monthly) : "N/A"],
                  ].map(([k, v]) => (
                    <div className="ym-mort-detail" key={`ym-mort-detail-${k}`}>
                      <div className="ym-mort-detail__k">{k}</div>
                      <div className="ym-mort-detail__v">{v}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="ym-mort-muted">Select a row to view details.</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="ym-mort-footer">
        <div className="ym-mort-footer__inner">
          <div className="ym-mort-footer__left">
            <div className="ym-mort-footer__brand">Yunometa • Mortgages Dashboard</div>
            <div className="ym-mort-footer__muted">Monitoring registered mortgages and encumbrances.</div>
          </div>
          <div className="ym-mort-footer__right">
            <span className="ym-mort-footer__pill">Data: Demo</span>
            <span className="ym-mort-footer__pill">Theme: Serbia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
