// LegalCleanliness.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { fetchDashboardStats, getParcels } from "../utils/api";
import "./LegalCleanliness.css";

/* -----------------------------
   Small UI helpers / icons
------------------------------ */
const Icon = {
  Scale: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 3v18M7 6h10M6 6l-3 6a4 4 0 0 0 8 0L8 6Zm10 0 3 6a4 4 0 0 1-8 0l3-6Zm-8 14h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  CheckCircle: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M9 12.5l2 2.2 4.7-5.2M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Clock: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Zm0-14v5l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  AlertTriangle: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 3 1.8 20.2h20.4L12 3Zm0 6v5m0 4h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Info: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Zm0-11v6m0-9h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Hash: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M9 3 7 21M17 3l-2 18M5 8h16M4 16h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Shield: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 2l8 4v6c0 5-3.4 9.3-8 10-4.6-.7-8-5-8-10V6l8-4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Dot: (props) => (
    <svg viewBox="0 0 10 10" aria-hidden="true" {...props}>
      <circle cx="5" cy="5" r="4" fill="currentColor" />
    </svg>
  ),
  Plus: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Search: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.1-1.4L21 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Filter: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Calendar: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M7 3v2M17 3v2M4 8h16M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  X: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M18 6 6 18M6 6l12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  ArrowLeft: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M15 18l-6-6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Bell: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Zm-8.5 11a2.5 2.5 0 0 0 5 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  User: (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

function formatNumber(n) {
  const s = String(n);
  const parts = [];
  let i = s.length;
  while (i > 3) {
    parts.unshift(s.slice(i - 3, i));
    i -= 3;
  }
  parts.unshift(s.slice(0, i));
  return parts.join(",");
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/* -----------------------------
   Tooltip hook
------------------------------ */
function useHoverTooltip() {
  const [tip, setTip] = useState({ show: false, x: 0, y: 0, title: "", value: "" });
  const containerRef = useRef(null);

  function show(e, title, value) {
    const rect = containerRef.current?.getBoundingClientRect();
    const clientX = e?.clientX ?? rect?.left ?? 0;
    const clientY = e?.clientY ?? rect?.top ?? 0;

    const x = rect ? clientX - rect.left : 0;
    const y = rect ? clientY - rect.top : 0;

    setTip({
      show: true,
      x: clamp(x, 12, (rect?.width ?? 0) - 12),
      y: clamp(y, 12, (rect?.height ?? 0) - 12),
      title,
      value,
    });
  }

  function move(e) {
    if (!tip.show) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTip((t) => ({
      ...t,
      x: clamp(x, 12, rect.width - 12),
      y: clamp(y, 12, rect.height - 12),
    }));
  }

  function hide() {
    setTip((t) => ({ ...t, show: false }));
  }

  const TooltipEl = (
    <div
      className={`lcTip ${tip.show ? "lcTip_show" : ""}`}
      style={{ left: tip.x, top: tip.y }}
      role="status"
      aria-live="polite"
    >
      <div className="lcTipTitle">{tip.title}</div>
      <div className="lcTipValue">{tip.value}</div>
    </div>
  );

  return { containerRef, tip, TooltipEl, show, move, hide };
}

/* -----------------------------
   Donut chart (SVG)
------------------------------ */
function DonutChart({ data, centerLabel = "Legal Status", onHover }) {
  const size = 220;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const segments = [];
  let offset = 0;

  data.forEach((d) => {
    const frac = total ? d.value / total : 0;
    const dash = frac * c;

    segments.push({
      ...d,
      dash,
      offset,
    });

    offset += dash;
  });

  const rotate = -90 + 18;

  return (
    <div className="lcDonut">
      <div className="lcDonutSvgWrap">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="lcDonutSvg"
          role="img"
          aria-label="Legal status overview donut chart"
        >
          <g transform={`rotate(${rotate} ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="var(--lc-border)"
              strokeWidth={stroke}
              fill="none"
            />
            {segments.map((s, idx) => (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={s.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${s.dash} ${c - s.dash}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="butt"
                className="lcDonutSeg"
                tabIndex={0}
                onMouseEnter={(e) => onHover?.(e, s.label, `${s.value.toFixed(1)}%`)}
                onMouseMove={(e) => onHover?.(e, s.label, `${s.value.toFixed(1)}%`)}
                onMouseLeave={() => onHover?.(null, "", "")}
                onFocus={(e) => onHover?.(e, s.label, `${s.value.toFixed(1)}%`)}
                onBlur={() => onHover?.(null, "", "")}
              />
            ))}
          </g>

          <g className="lcDonutCenter">
            <text x="50%" y="47%" textAnchor="middle" className="lcDonutCenterTitle">
              {centerLabel}
            </text>
            <text x="50%" y="58%" textAnchor="middle" className="lcDonutCenterSub">
              Overview
            </text>
          </g>
        </svg>
      </div>

      <div className="lcLegend">
        {data.map((d, i) => (
          <div key={i} className="lcLegendItem">
            <span className="lcLegendDot" style={{ background: d.color }} />
            <span className="lcLegendText">
              {d.label}: <b>{d.value.toFixed(1)}%</b>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -----------------------------
   Horizontal bar chart (SVG)
------------------------------ */
function HorizontalBarChart({ items, maxX = 600, onHover }) {
  const height = 280;
  const leftPad = 180;
  const rightPad = 30;
  const topPad = 18;
  const rowH = 40;

  const width = 740;
  const chartW = width - leftPad - rightPad;

  const ticks = [0, 150, 300, 450, 600].filter((t) => t <= maxX);
  const scale = (v) => (maxX ? (v / maxX) * chartW : 0);

  return (
    <div className="lcBarChartWrap">
      <svg
        viewBox={`0 0 ${width}  ${height}`}
        className="lcBarSvg"
        role="img"
        aria-label="Risk flags distribution bar chart"
      >
        {ticks.map((t, idx) => {
          const x = leftPad + scale(t);
          return (
            <g key={idx}>
              <line x1={x} y1={topPad} x2={x} y2={height - 46} className="lcBarGrid" />
              <text x={x} y={height - 20} textAnchor="middle" className="lcBarTick">
                {t}
              </text>
            </g>
          );
        })}

        {items.map((it, i) => {
          const y = topPad + i * rowH + 10;
          const barH = 18;
          const w = scale(it.value);

          return (
            <g key={i} className="lcBarRow">
              <text x={leftPad - 10} y={y + 13} textAnchor="end" className="lcBarLabel">
                {it.label}
              </text>

              <rect
                x={leftPad}
                y={y}
                width={Math.max(2, w)}
                height={barH}
                rx="4"
                className="lcBar"
                style={{ fill: it.color }}
                tabIndex={0}
                onMouseEnter={(e) => onHover?.(e, it.label, `${it.value}`)}
                onMouseMove={(e) => onHover?.(e, it.label, `${it.value}`)}
                onMouseLeave={() => onHover?.(null, "", "")}
                onFocus={(e) => onHover?.(e, it.label, `${it.value}`)}
                onBlur={() => onHover?.(null, "", "")}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* -----------------------------
   Main Page
------------------------------ */
export default function LegalCleanliness() {
  const [apiStats, setApiStats] = useState(null);
  const [parcelRows, setParcelRows] = useState([]);

  useEffect(() => {
    fetchDashboardStats()
      .then((res) => setApiStats(res?.data ?? null))
      .catch((err) => console.error("LegalCleanliness stats error:", err));

    getParcels({ limit: 1000 })
      .then((res) => {
        const data = res?.data ?? [];
        setParcelRows(
          data.map((p) => {
            const legalKey = p.legalStatus ?? "pending";
            // map backend legalStatus to display status key
            const statusKey = legalKey === "clean" ? "verified" : legalKey;
            const restrictions = p.restrictions ?? [];
            const flags = restrictions.map((r) => {
              const t = r.type ?? "";
              if (t === "mortgage") return "Active mortgage";
              if (t === "lien") return "Lien registered";
              if (t === "easement") return "Easement recorded";
              if (t === "zoning") return "Zoning violation";
              if (t === "environmental") return "Environmental clearance missing";
              if (t === "legal") return "Legal restriction";
              return r.description || t;
            });
            const hasActiveMortgage = p.hasMortgage;
            const mortgageKey = hasActiveMortgage ? "active" : "clear";
            return {
              parcel: p.parcelId ?? p._id,
              address: {
                line1: p.address?.street ?? p.address?.line1 ?? "—",
                line2: p.address?.city ?? p.region ?? "—",
              },
              status: { key: statusKey, text: statusKey },
              zoning: restrictions.some((r) => r.type === "zoning") ? "bad" : "ok",
              environmental: restrictions.some((r) => r.type === "environmental") ? "warn" : "ok",
              occupancy: "ok",
              mortgage: { key: mortgageKey, text: mortgageKey },
              hash: p.blockchainHash ?? "—",
              flags,
            };
          })
        );
      })
      .catch((err) => console.error("LegalCleanliness parcels error:", err));
  }, []);

  // Derive metrics from API when available, else use fallback values
  const verifiedPct = apiStats?.parcels?.verificationRate ?? 78.4;
  const pendingPct = apiStats?.parcels?.pendingRate ?? 14.2;
  const disputedPct = apiStats?.disputes?.activeRate ?? 5.8;
  const litigationPct = Math.max(0, 100 - verifiedPct - pendingPct - disputedPct).toFixed(1) * 1 || 1.6;
  const disputeCount = apiStats?.disputes?.total ?? 1217;
  const avgRegDays = apiStats?.parcels?.avgRegistrationDays ?? 4.2;

  const statusBreakdown = useMemo(
    () => [
      { key: "verified", label: "Verified", value: verifiedPct, color: "var(--lc-green)" },
      { key: "pending", label: "Pending", value: pendingPct, color: "var(--lc-orange)" },
      { key: "disputed", label: "Disputed", value: disputedPct, color: "var(--lc-red)" },
      { key: "litigation", label: "Litigation", value: litigationPct, color: "var(--lc-navy)" },
    ],
    [verifiedPct, pendingPct, disputedPct, litigationPct]
  );

  const riskFlags = useMemo(
    () => [
      { label: "Title Conflicts", value: 240, color: "var(--lc-redbar)" },
      { label: "Duplicate\nRegistrations", value: 90, color: "var(--lc-redbar)" },
      { label: "Zoning Violations", value: 160, color: "var(--lc-amberbar)" },
      { label: "Unregistered\nExtensions", value: 420, color: "var(--lc-steelbar)" },
      { label: "Missing Clearances", value: 320, color: "var(--lc-amberbar)" },
      { label: "Post-sale\nModifications", value: 150, color: "var(--lc-amberbar)" },
    ],
    []
  );

  const donutTip = useHoverTooltip();
  const barTip = useHoverTooltip();

  const kpis = useMemo(
    () => [
      {
        tone: "good",
        icon: <Icon.CheckCircle className="lcKpiIcon" />,
        label: "Fully Verified",
        value: `${verifiedPct.toFixed(1)}%`,
        sub: "Properties legally clean",
      },
      {
        tone: "warn",
        icon: <Icon.Clock className="lcKpiIcon" />,
        label: "Pending Checks",
        value: `${pendingPct.toFixed(1)}%`,
        sub: "Awaiting verification",
      },
      {
        tone: "bad",
        icon: <Icon.AlertTriangle className="lcKpiIcon" />,
        label: "Disputed",
        value: `${disputedPct.toFixed(1)}%`,
        sub: `${disputeCount.toLocaleString()} active disputes`,
      },
      {
        tone: "neutral",
        icon: <Icon.Info className="lcKpiIcon" />,
        label: "Avg Registration",
        value: `${avgRegDays} days`,
        delta: "(-18.5%)",
        sub: `Improved from ${(avgRegDays * 1.185).toFixed(1)} days`,
      },
    ],
    [verifiedPct, pendingPct, disputedPct, disputeCount, avgRegDays]
  );

  const rows = useMemo(() => {
    if (parcelRows.length > 0) return parcelRows;
    // Fallback mock rows shown while loading or if API returns nothing
    return [
      { parcel: "BG-2024-45892", address: { line1: "Knez Mihailova 22", line2: "Belgrade" }, status: { key: "verified", text: "verified" }, zoning: "ok", environmental: "ok", occupancy: "ok", mortgage: { key: "clear", text: "clear" }, hash: "0x7a8b9c...3d4e5f", flags: [] },
      { parcel: "BG-2024-45893", address: { line1: "Terazije 15", line2: "Belgrade" }, status: { key: "pending", text: "pending" }, zoning: "ok", environmental: "warn", occupancy: "ok", mortgage: { key: "active", text: "active" }, hash: "0x1f2e3d...6a7b8c", flags: ["Environmental clearance missing"] },
      { parcel: "NS-2024-12456", address: { line1: "Zmaj Jovina 8", line2: "Novi Sad" }, status: { key: "disputed", text: "disputed" }, zoning: "ok", environmental: "ok", occupancy: "warn", mortgage: { key: "clear", text: "clear" }, hash: "0x9c8b7a...4e3d2c", flags: ["Title conflict", "Missing occupancy certificate"] },
      { parcel: "NI-2024-78234", address: { line1: "Obrenovićeva 42", line2: "Niš" }, status: { key: "verified", text: "verified" }, zoning: "ok", environmental: "ok", occupancy: "ok", mortgage: { key: "active", text: "active" }, hash: "0x5d6e7f...2a1b0c", flags: [] },
      { parcel: "KG-2024-34567", address: { line1: "Kralja Petra 18", line2: "Kragujevac" }, status: { key: "litigation", text: "litigation" }, zoning: "bad", environmental: "ok", occupancy: "warn", mortgage: { key: "defaulted", text: "defaulted" }, hash: "0x3c4d5e...8f9g0h", flags: ["Under court stay", "Zoning violation"] },
      { parcel: "SU-2024-56789", address: { line1: "Korzo 25", line2: "Subotica" }, status: { key: "verified", text: "verified" }, zoning: "ok", environmental: "ok", occupancy: "ok", mortgage: { key: "clear", text: "clear" }, hash: "0x2b3c4d...7e8f9g", flags: [] },
      { parcel: "ZR-2024-23456", address: { line1: "Glavna 12", line2: "Zrenjanin" }, status: { key: "pending", text: "pending" }, zoning: "ok", environmental: "ok", occupancy: "warn", mortgage: { key: "active", text: "active" }, hash: "0x8e9f0g...3a4b5c", flags: ["Pending occupancy verification"] },
      { parcel: "PA-2024-67890", address: { line1: "Vojvode Radomira 5", line2: "Pančevo" }, status: { key: "verified", text: "verified" }, zoning: "ok", environmental: "ok", occupancy: "ok", mortgage: { key: "clear", text: "clear" }, hash: "0x4d5e6f...9g0h1i", flags: [] },
    ];
  }, [parcelRows]);

  const chainStats = useMemo(
    () => ({
      totalProps: 1247832,
      totalPropsPct: 78,
      transfers: 3456789,
      tamper: 23,
    }),
    []
  );

  function handleDonutHover(e, title, value) {
    if (!title) return donutTip.hide();
    donutTip.show(e, title, value);
  }
  function handleBarHover(e, title, value) {
    if (!title) return barTip.hide();
    barTip.show(e, title, value);
  }

  function CellCheck({ state }) {
    if (state === "ok") {
      return (
        <span className="lcCellIcon lcCellIcon_ok" title="OK">
          ✓
        </span>
      );
    }
    if (state === "warn") {
      return (
        <span className="lcCellIcon lcCellIcon_warn" title="Warning">
          !
        </span>
      );
    }
    return (
      <span className="lcCellIcon lcCellIcon_bad" title="Issue">
        !
      </span>
    );
  }

  function StatusPill({ kind, text }) {
    return <span className={`lcPill lcPill_${kind}`}>{text}</span>;
  }

  /* -----------------------------
     Search + Filters (Table tools)
  ------------------------------ */
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mortgageFilter, setMortgageFilter] = useState("all");
  const [flagsFilter, setFlagsFilter] = useState("all"); // all | any | none

  /* -----------------------------
     Top Filters Bar (like reference)
  ------------------------------ */
  const [topQuery, setTopQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30"); // 7 | 30 | 90

  const regions = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      const city = (r.address?.line2 ?? "").trim();
      if (city) set.add(city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tq = topQuery.trim().toLowerCase();

    return rows.filter((r) => {
      const matchesQuery =
        (!q ||
          r.parcel.replace(/\s+/g, " ").toLowerCase().includes(q) ||
          r.address.line1.toLowerCase().includes(q) ||
          r.address.line2.toLowerCase().includes(q) ||
          r.hash.toLowerCase().includes(q) ||
          r.flags.join(" ").toLowerCase().includes(q)) &&
        (!tq ||
          r.parcel.replace(/\s+/g, " ").toLowerCase().includes(tq) ||
          r.address.line1.toLowerCase().includes(tq) ||
          r.address.line2.toLowerCase().includes(tq) ||
          r.hash.toLowerCase().includes(tq) ||
          r.flags.join(" ").toLowerCase().includes(tq));

      const matchesStatus = statusFilter === "all" || r.status.key === statusFilter;
      const matchesMortgage = mortgageFilter === "all" || r.mortgage.key === mortgageFilter;

      const hasFlags = r.flags.length > 0;
      const matchesFlags =
        flagsFilter === "all" ||
        (flagsFilter === "any" && hasFlags) ||
        (flagsFilter === "none" && !hasFlags);

      const matchesRegion =
        regionFilter === "all" || (r.address?.line2 ?? "").toLowerCase() === regionFilter.toLowerCase();

      // dateRange is UI-only here (no row date field available)
      return matchesQuery && matchesStatus && matchesMortgage && matchesFlags && matchesRegion;
    });
  }, [rows, query, statusFilter, mortgageFilter, flagsFilter, topQuery, regionFilter]);

  const activeFiltersCount =
    (query.trim() ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (mortgageFilter !== "all" ? 1 : 0) +
    (flagsFilter !== "all" ? 1 : 0) +
    (topQuery.trim() ? 1 : 0) +
    (regionFilter !== "all" ? 1 : 0) +
    (dateRange !== "30" ? 1 : 0);

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setMortgageFilter("all");
    setFlagsFilter("all");
    setTopQuery("");
    setRegionFilter("all");
    setDateRange("30");
  }

  function handleBack() {
    window.history.back();
  }

  /* -----------------------------
     NEW: Pagination for table
     - 20 rows per page
  ------------------------------ */
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => {
    const t = Math.ceil(filteredRows.length / PAGE_SIZE);
    return Math.max(1, t);
  }, [filteredRows.length]);

  // Reset to page 1 when filters/search changes
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, mortgageFilter, flagsFilter, topQuery, regionFilter, dateRange]);

  // Clamp page if data changes
  useEffect(() => {
    setPage((p) => Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const showingFrom = filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(filteredRows.length, page * PAGE_SIZE);

  // small page list with ellipsis
  const pageButtons = useMemo(() => {
    const pages = [];
    const add = (x) => pages.push(x);

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) add(i);
      return pages;
    }

    add(1);
    if (page > 3) add("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i);
    if (page < totalPages - 2) add("...");
    add(totalPages);
    return pages;
  }, [page, totalPages]);

  return (
    <div className="lcPage">
      <div className="lcTopBar" />

      <div className="lcWrap">
        {/* TOP APP BAR (like your screenshot) */}
        <div className="lcAppBar">
          <button type="button" className="lcReturnBtn" onClick={handleBack} aria-label="Return">
            <Icon.ArrowLeft className="lcReturnIcon" />
            <span>Return</span>
          </button>

          <div className="lcAppBrand" aria-label="Brand">
            <div className="lcAppBrandIcon" aria-hidden="true">
              <Icon.Shield className="lcAppBrandIconSvg" />
            </div>
            <div className="lcAppBrandText">
              <div className="lcAppBrandName">Legal Complaince</div>
              <div className="lcAppBrandSub">Dashboard</div>
            </div>
          </div>

          <div className="lcAppActions" aria-label="Actions">
            <button type="button" className="lcIconBtn" aria-label="Notifications">
              <Icon.Bell className="lcIconBtnSvg" />
            </button>
            <button type="button" className="lcIconBtn" aria-label="Account">
              <Icon.User className="lcIconBtnSvg" />
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="lcHeader">
          <div className="lcHeaderRow">
            <div className="lcBrand">
              <div className="lcLogoMark" aria-hidden="true">
                <Icon.Shield className="lcLogoIcon" />
              </div>
              <div className="lcBrandText">
                <div className="lcBrandName">RegistryGuard</div>
                <div className="lcBrandTag">Compliance &amp; Verification</div>
              </div>
            </div>

            <div className="lcBadge">
              <Icon.Scale className="lcBadgeIcon" />
              <span>Legal Verification</span>
            </div>
          </div>

          <h1 className="lcTitle">Legal Compliance Dashboard</h1>
          <p className="lcSubtitle">Every registered property — legally clean, verified, and enforceable</p>
        </header>

        {/* FILTER BAR (moved AFTER header as requested) */}
        <section className="lcFiltersBar">
          <div className="lcFiltersHeader">
            <Icon.Filter className="lcFiltersHeaderIcon" />
            <div className="lcFiltersHeaderTitle">Filters</div>
          </div>

          <div className="lcFiltersControls">
            <div className="lcFiltersSearch">
              <Icon.Search className="lcFiltersIcon" />
              <input
                className="lcFiltersInput"
                value={topQuery}
                onChange={(e) => setTopQuery(e.target.value)}
                placeholder="Search by ID or name..."
                aria-label="Top search"
              />
            </div>

            <div className="lcFiltersSelect">
              <select
                className="lcFiltersSelectEl"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                aria-label="Filter by region"
              >
                <option value="all">All Regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="lcFiltersSelect lcFiltersSelect_date">
              <Icon.Calendar className="lcFiltersIcon lcFiltersIcon_calendar" />
              <select
                className="lcFiltersSelectEl"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                aria-label="Filter by date range"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>

          <div className="lcFiltersDivider" />

          <button type="button" className="lcFiltersReset" onClick={clearFilters} disabled={activeFiltersCount === 0}>
            <Icon.X className="lcFiltersResetIcon" />
            <span>Reset filters</span>
          </button>
        </section>

        {/* KPI cards */}
        <section className="lcKpiGrid">
          {kpis.map((k, i) => (
            <div key={i} className={`lcKpiCard lcKpiCard_${k.tone}`}>
              <div className="lcKpiTop">
                <div className="lcKpiTopLeft">
                  <span className={`lcKpiIconWrap lcKpiIconWrap_${k.tone}`}>{k.icon}</span>
                  <span className="lcKpiLabel">{k.label}</span>
                </div>
              </div>
              <div className="lcKpiValueRow">
                <div className="lcKpiValue">{k.value}</div>
                {k.delta ? <div className="lcKpiDelta">{k.delta}</div> : null}
              </div>
              <div className="lcKpiSub">{k.sub}</div>
            </div>
          ))}
        </section>

        {/* Charts row */}
        <section className="lcGrid2">
          <div className="lcCard">
            <div className="lcCardHeader">
              <h3 className="lcCardTitle">Legal Status Overview</h3>
            </div>

            <div
              className="lcCardBody lcChartBody"
              ref={donutTip.containerRef}
              onMouseMove={donutTip.move}
              onMouseLeave={donutTip.hide}
            >
              <DonutChart data={statusBreakdown} centerLabel="Legal Status" onHover={handleDonutHover} />
              {donutTip.TooltipEl}
            </div>
          </div>

          <div className="lcCard">
            <div className="lcCardHeader">
              <h3 className="lcCardTitle">Risk Flags Distribution</h3>
              <p className="lcCardHint">Auto-generated alerts requiring attention</p>
            </div>

            <div className="lcCardBody" ref={barTip.containerRef} onMouseMove={barTip.move} onMouseLeave={barTip.hide}>
              <HorizontalBarChart items={riskFlags} maxX={600} onHover={handleBarHover} />
              {barTip.TooltipEl}
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="lcCard lcTableCard">
          <div className="lcCardHeader lcCardHeader_tools">
            <div>
              <h3 className="lcCardTitle">Property Verification Status</h3>
              <p className="lcCardHint">Detailed lifecycle and compliance status per parcel</p>
            </div>

            {/* Search + Filter tools (existing) */}
            <div className="lcTools">
              <div className="lcSearch">
                <Icon.Search className="lcToolIcon" />
                <input
                  className="lcSearchInput"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search parcel, address, hash, flags..."
                  aria-label="Search rows"
                />
              </div>

              <div className="lcSelect">
                <Icon.Filter className="lcToolIcon" />
                <select
                  className="lcSelectEl"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="disputed">Disputed</option>
                  <option value="litigation">Litigation</option>
                </select>
              </div>

              <div className="lcSelect">
                <Icon.Filter className="lcToolIcon" />
                <select
                  className="lcSelectEl"
                  value={mortgageFilter}
                  onChange={(e) => setMortgageFilter(e.target.value)}
                  aria-label="Filter by mortgage"
                >
                  <option value="all">All Mortgage</option>
                  <option value="clear">Clear</option>
                  <option value="active">Active</option>
                  <option value="defaulted">Defaulted</option>
                </select>
              </div>

              <div className="lcSelect">
                <Icon.Filter className="lcToolIcon" />
                <select
                  className="lcSelectEl"
                  value={flagsFilter}
                  onChange={(e) => setFlagsFilter(e.target.value)}
                  aria-label="Filter by risk flags"
                >
                  <option value="all">All Flags</option>
                  <option value="any">Has Flags</option>
                  <option value="none">No Flags</option>
                </select>
              </div>

              <button
                type="button"
                className="lcBtn"
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
                title="Clear filters"
              >
                Clear
                {activeFiltersCount ? <span className="lcBtnBadge">{activeFiltersCount}</span> : null}
              </button>
            </div>
          </div>

          <div className="lcTableWrap">
            <table className="lcTable">
              <thead>
                <tr>
                  <th>Parcel ID</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Zoning</th>
                  <th>Environmental</th>
                  <th>Occupancy</th>
                  <th>Mortgage</th>
                  <th>Blockchain Hash</th>
                  <th>Risk Flags</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="lcEmpty">
                        <div className="lcEmptyTitle">No results found</div>
                        <div className="lcEmptySub">Try changing your search or filters.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((r, idx) => (
                    <tr key={`${r.parcel}-${idx}`} className={r.status.key === "disputed" ? "lcRowDisputed" : ""}>
                      <td className="lcMono lcParcel">{r.parcel}</td>
                      <td>
                        <div className="lcAddr">
                          <div className="lcAddrLine1">{r.address.line1}</div>
                          <div className="lcAddrLine2">{r.address.line2}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`lcPill lcPill_${r.status.key}`}>{r.status.text}</span>
                      </td>
                      <td className="lcCenter">
                        <CellCheck state={r.zoning} />
                      </td>
                      <td className="lcCenter">
                        <CellCheck state={r.environmental} />
                      </td>
                      <td className="lcCenter">
                        <CellCheck state={r.occupancy} />
                      </td>
                      <td>
                        <span className={`lcPill lcPill_mort_${r.mortgage.key}`}>{r.mortgage.text}</span>
                      </td>
                      <td className="lcMono lcHash">
                        <span className="lcHashRow">
                          <Icon.Hash className="lcHashIcon" />
                          {r.hash}
                        </span>
                      </td>
                      <td>
                        {r.flags.length === 0 ? (
                          <span className="lcStatusOkText">None</span>
                        ) : (
                          <div className="lcFlags">
                            {/* Keep your existing logic; show +N if too many flags */}
                            {(() => {
                              const max = 2;
                              const visible = r.flags.slice(0, max);
                              const more = r.flags.length - visible.length;
                              return (
                                <>
                                  {visible.map((f, j) => (
                                    <span key={j} className="lcFlag lcFlag_bad">
                                      {f}
                                    </span>
                                  ))}
                                  {more > 0 ? (
                                    <span className="lcFlag lcFlag_more" title={`${more} more`}>
                                      <Icon.Plus className="lcPlusIcon" /> {more}
                                    </span>
                                  ) : null}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {filteredRows.length > 0 ? (
            <div className="lcPager">
              <div className="lcPagerInfo">
                Showing <b>{showingFrom}</b>–<b>{showingTo}</b> of <b>{filteredRows.length}</b>
              </div>

              <div className="lcPagerBtns">
                <button
                  type="button"
                  className="lcPagerBtn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </button>

                {pageButtons.map((p, i) =>
                  p === "..." ? (
                    <span key={`e-${i}`} className="lcPagerDots">
                      …
                    </span>
                  ) : (
                    <button
                      key={`p-${p}`}
                      type="button"
                      className={`lcPagerNum ${p === page ? "lcPagerNum_active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="lcPagerBtn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* Blockchain Audit Trail */}
        <section className="lcCard">
          <div className="lcCardHeader">
            <div className="lcCardTitleRow">
              <h3 className="lcCardTitle">Blockchain Audit Trail</h3>
            </div>
          </div>

          <div className="lcAuditGrid">
            <div className="lcAuditCard">
              <div className="lcAuditLabel">Total Properties on Chain</div>
              <div className="lcAuditValue">{formatNumber(chainStats.totalProps)}</div>
              <div className="lcAuditHint">{chainStats.totalPropsPct}% of total registry</div>

              <div className="lcProgress">
                <div className="lcProgressFill" style={{ width: `${chainStats.totalPropsPct}%` }} />
              </div>
            </div>

            <div className="lcAuditCard">
              <div className="lcAuditLabel">Ownership Transfers Logged</div>
              <div className="lcAuditValue">{formatNumber(chainStats.transfers)}</div>
              <div className="lcAuditHint">Immutable audit trail</div>
            </div>

            <div className="lcAuditCard lcAuditCard_bad">
              <div className="lcAuditLabel lcAuditLabel_bad">Tamper Attempts Detected</div>
              <div className="lcAuditValue lcAuditValue_bad">{chainStats.tamper}</div>
              <div className="lcAuditHint">All blocked &amp; reported</div>
            </div>
          </div>
        </section>

        <div className="lcFooterSpace" />

        <footer className="lcFooter">
          <div className="lcFooterInner">
            <div className="lcFooterLeft">
              <span className="lcFooterDot" />
              <span className="lcFooterText">© {new Date().getFullYear()} RegistryGuard • Legal Compliance Dashboard</span>
            </div>
            <div className="lcFooterRight">
              <span className="lcFooterPill">
                <Icon.Shield className="lcFooterIcon" />
                Secured
              </span>
              <span className="lcFooterPill">
                <Icon.Scale className="lcFooterIcon" />
                Audited
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}