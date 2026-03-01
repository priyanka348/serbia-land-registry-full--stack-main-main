// BubbleRisk.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./BubbleRisk.css";
import { getBubbleRiskData, getRegionalData, getTransfers, getMortgages } from "../utils/api";

/* -----------------------------
   Icons (unique)
------------------------------ */
const BrxIcon = {
  TrendUp: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M3 17l7-7 4 4 7-7M14 7h7v7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Home: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Percent: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M19 5 5 19M7.5 7.5h.01M16.5 16.5h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="7.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="16.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  Building: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M4 21V3h10v18M20 21V9h-6M8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Spark: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M13 2 3 14h8l-1 8 11-14h-8l0-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Target: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Zm0-6a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.2-1.8L21 20.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Filter: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M7 3v3M17 3v3M4 8h16M6 12h4M6 16h4M14 12h4M14 16h4M6 21h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Back: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
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
  Shield: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M12 2 20 6v6c0 5-3.4 9.3-8 10-4.6-.7-8-5-8-10V6l8-4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.2 11.3 14l3.7-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Bell: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 19a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
      <path
        d="M20 21a8 8 0 1 0-16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* -----------------------------
   Utils
------------------------------ */
function brxClamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function brxPct(n) {
  return `${n.toFixed(1)}%`;
}

/* -----------------------------
   Tooltip hook (no blinking)
------------------------------ */
function useBrxTooltip() {
  const [tip, setTip] = useState({ show: false, x: 0, y: 0, title: "", value: "" });
  const wrapRef = useRef(null);

  const getXY = (e) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, rect: null };
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      rect,
      x: brxClamp(x, 14, rect.width - 14),
      y: brxClamp(y, 14, rect.height - 14),
    };
  };

  const show = (e, title, value) => {
    if (!e) return;
    const { x, y } = getXY(e);
    setTip({ show: true, x, y, title, value });
  };

  const move = (e) => {
    setTip((t) => {
      if (!t.show) return t;
      const { rect, x, y } = getXY(e);
      if (!rect) return t;
      if (Math.abs(t.x - x) < 0.5 && Math.abs(t.y - y) < 0.5) return t;
      return { ...t, x, y };
    });
  };

  const hide = () => setTip((t) => ({ ...t, show: false }));

  const TooltipEl = (
    <div className={`brxTip ${tip.show ? "brxTip_show" : ""}`} style={{ left: tip.x, top: tip.y }}>
      <div className="brxTipTitle">{tip.title}</div>
      <div className="brxTipValue">{tip.value}</div>
    </div>
  );

  return { wrapRef, TooltipEl, show, move, hide };
}

/* -----------------------------
   Line chart (SVG)
------------------------------ */
function BrxLineChart({ labels, series, yMin = 0, yMax = 20, onPointEnter, onPointLeave }) {
  const W = 860;
  const H = 380;
  const padL = 58;
  const padR = 24;
  const padT = 24;
  const padB = 70;

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xFor = (i) => padL + (innerW * i) / (labels.length - 1 || 1);
  const yFor = (v) => padT + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  const yTicks = [0, 5, 10, 15, 20].filter((t) => t >= yMin && t <= yMax);

  const pathFor = (values) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(v)}`).join(" ");

  const legendY = H - 38;
  const monthY = H - 18;

  return (
    <div className="brxChartWrap">
      <svg className="brxChartSvg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bubble chart">
        {/* y grid */}
        {yTicks.map((t, idx) => {
          const y = yFor(t);
          return (
            <g key={idx}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} className="brxGridLine" />
              <text x={padL - 10} y={y + 4} textAnchor="end" className="brxAxisTick">
                {t}%
              </text>
            </g>
          );
        })}

        {/* x labels */}
        {labels.map((lab, i) => (
          <text key={i} x={xFor(i)} y={monthY} textAnchor="middle" className="brxAxisTickX">
            {lab}
          </text>
        ))}

        {/* series */}
        {series.map((s, si) => (
          <g key={si}>
            <path d={pathFor(s.values)} fill="none" stroke={s.color} strokeWidth="3" />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={xFor(i)}
                cy={yFor(v)}
                r="5"
                fill={s.color}
                className="brxPoint"
                tabIndex={0}
                onMouseEnter={(e) => onPointEnter?.(e, `${labels[i]} — ${s.label}`, brxPct(v))}
                onMouseMove={(e) => onPointEnter?.(e, `${labels[i]} — ${s.label}`, brxPct(v))}
                onMouseLeave={onPointLeave}
                onFocus={(e) => onPointEnter?.(e, `${labels[i]} — ${s.label}`, brxPct(v))}
                onBlur={onPointLeave}
              />
            ))}
          </g>
        ))}

        {/* legend */}
        <g className="brxLegend" transform={`translate(0, ${legendY})`}>
          {series.map((s, i) => (
            <g key={i} transform={`translate(${padL + i * 170}, 0)`}>
              <circle cx="0" cy="0" r="4" fill={s.color} />
              <text x="10" y="4" className="brxLegendText">
                {s.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

/* -----------------------------
   Small components
------------------------------ */
function BrxKpi({ tone, accent, icon, title, value, sub, chip }) {
  return (
    <div className={`brxKpi brxKpi_${tone} brxKpiAccent brxKpiAccent_${accent}`}>
      <div className="brxKpiTop">
        <span className="brxKpiIcon">{icon}</span>
        <span className="brxKpiTitle">{title}</span>
      </div>
      <div className="brxKpiValue">{value}</div>
      <div className="brxKpiSub">
        <span>{sub}</span>
        {chip ? <span className={`brxKpiChip brxKpiChip_${tone}`}>{chip}</span> : null}
      </div>
    </div>
  );
}

function BrxProgress({ label, value, tone }) {
  return (
    <div className="brxProg">
      <div className="brxProgTop">
        <span className="brxProgLabel">{label}</span>
        <span className={`brxProgValue brxProgValue_${tone}`}>{value}/100</span>
      </div>
      <div className="brxProgTrack">
        <div className={`brxProgFill brxProgFill_${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function BrxStress({ tone, title, value, sub }) {
  return (
    <div className={`brxStress brxStress_${tone}`}>
      <div className="brxStressTitle">{title}</div>
      <div className="brxStressValue">{value}</div>
      <div className="brxStressSub">{sub}</div>
    </div>
  );
}

function BrxRiskPill({ tone, text }) {
  return <span className={`brxPill brxPill_${tone}`}>{text}</span>;
}

function BrxBadgePill({ tone, text }) {
  return <span className={`brxMiniPill brxMiniPill_${tone}`}>{text}</span>;
}

function BrxMiniBar({ value }) {
  return (
    <div className="brxMiniBar" aria-hidden="true">
      <div className="brxMiniBarFill" style={{ width: `${value}%` }} />
    </div>
  );
}

/* -----------------------------
   Page
------------------------------ */
export default function BubbleRisk() {
  const navigate = useNavigate();
  const tip = useBrxTooltip();

  // ── API State ──────────────────────────────────────────────
  const [bubbleData, setBubbleData] = useState(null);
  const [regionalData, setRegionalData] = useState([]);
  const [transferData, setTransferData] = useState(null);
  const [mortgageData, setMortgageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getBubbleRiskData(),
      getRegionalData(),
      getTransfers({ limit: 1 }), // just for pagination totals
      getMortgages({ limit: 1 }),
    ])
      .then(([bubRes, regRes, trfRes, mtgRes]) => {
        if (bubRes.status === "fulfilled") setBubbleData(bubRes.value?.data ?? null);
        if (regRes.status === "fulfilled") setRegionalData(regRes.value?.data ?? []);
        if (trfRes.status === "fulfilled") setTransferData(trfRes.value ?? null);
        if (mtgRes.status === "fulfilled") setMortgageData(mtgRes.value ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Filters (Top Bar like reference) ───────────────────────
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [region, setRegion] = useState("all");
  const [dateRange, setDateRange] = useState("30"); // "7" | "30" | "90"

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
    setRegion("all");
    setDateRange("30");
  };

  // ── Core metrics from bubble-risk API ─────────────────────
  const riskScore = bubbleData?.riskScore ?? 68;
  const priceGrowth = bubbleData?.currentPriceGrowth ?? 18.4;
  const incomeGrowth = bubbleData?.currentIncomeGrowth ?? 4.4;
  const growthGap = bubbleData?.growthGap ?? 14.0;
  const riskLevel = bubbleData?.interpretation?.riskLevel ?? "Moderate Risk";
  const divergence =
    incomeGrowth > 0 ? parseFloat((priceGrowth / incomeGrowth).toFixed(1)) : 4.2;

  // ── Monthly trend chart data (dateRange logic works) ───────
  const monthlyTrends = bubbleData?.monthlyTrends ?? [];

  // Convert days to "points" (safe for monthly data)
  const pointsForRange = (range) => {
    const d = Number(range || 30);
    if (d <= 7) return 2; // last ~week -> 2 points
    if (d <= 30) return 4; // last ~month -> 4 points
    return 7; // last ~90 -> 7 points
  };

  const slicedMonthly = useMemo(() => {
    if (!monthlyTrends || monthlyTrends.length === 0) return null;
    const pts = pointsForRange(dateRange);
    const start = Math.max(0, monthlyTrends.length - pts);
    return monthlyTrends.slice(start);
  }, [monthlyTrends, dateRange]);

  const labels = slicedMonthly?.length
    ? slicedMonthly.map((m) => m.month)
    : ["Jul 23", "Aug 23", "Sep 23", "Oct 23", "Nov 23", "Dec 23", "Jan 24", "Feb 24", "Apr 24"];

  const series = [
    {
      label: "Price Growth %",
      color: "var(--brx-red)",
      values: slicedMonthly?.length
        ? slicedMonthly.map((m) => m.priceGrowth)
        : [8.2, 9.1, 10.4, 11.8, 13.2, 14.6, 15.9, 16.3, 18.4],
    },
    {
      label: "Income Growth %",
      color: "var(--brx-green)",
      values: slicedMonthly?.length
        ? slicedMonthly.map((m) => m.incomeGrowth)
        : [3.6, 3.8, 3.9, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6],
    },
  ];

  // ── KPI cards ──────────────────────────────────────────────
  const kpis = [
    {
      tone: divergence >= 3 ? "danger" : "warn",
      accent: "red",
      icon: <BrxIcon.TrendUp className="brxSvgIcon" />,
      title: "Price vs Income Divergence",
      value: `${divergence}x`,
      sub: ">3x = Warning",
    },
    {
      tone: priceGrowth > 15 ? "danger" : "warn",
      accent: "green",
      icon: <BrxIcon.Home className="brxSvgIcon" />,
      title: "Avg Price Growth (YoY)",
      value: `${priceGrowth}%`,
      sub: `vs ${incomeGrowth}% income growth`,
    },
    {
      tone: growthGap > 10 ? "danger" : "warn",
      accent: "orange",
      icon: <BrxIcon.Percent className="brxSvgIcon" />,
      title: "Growth Gap",
      value: `${growthGap.toFixed(1)}%`,
      sub: ">10% = Elevated speculation",
    },
    {
      tone: riskScore > 80 ? "danger" : riskScore > 60 ? "warn" : "neutral",
      accent: "blue",
      icon: <BrxIcon.Building className="brxSvgIcon" />,
      title: "Overall Risk Score",
      value: `${riskScore}/100`,
      sub: riskLevel,
      chip: bubbleData?.trend === "increasing" ? "↑ Rising" : null,
    },
  ];

  // ── AI Forecast from riskScore ────────────────────────────
  const ai_tables = {
    six: Math.min(100, Math.round(riskScore * 0.92)),
    twelve: Math.min(100, Math.round(riskScore * 1.09)),
    correctionProb: riskScore > 80 ? 55 : riskScore > 60 ? 42 : 22,
    liquidityStress: riskScore > 80 ? 48 : riskScore > 60 ? 35 : 18,
  };

  // ── Stress signals: derived from transfer + mortgage data ──
  const totalTransfers = transferData?.pagination?.total ?? 0;
  const totalMortgages = mortgageData?.pagination?.total ?? 0;

  const stressSignals = [
    {
      tone: priceGrowth > 15 ? "danger" : "warn",
      title: "Rapid price appreciation (YoY)",
      value: `${priceGrowth}%`,
      sub: `vs ${incomeGrowth}% income — gap: ${growthGap.toFixed(1)}%`,
    },
    {
      tone: totalMortgages > 1000 ? "danger" : "warn",
      title: "Active mortgage registrations",
      value: totalMortgages > 0 ? totalMortgages.toLocaleString() : "8,920",
      sub: "Debt-backed purchase activity",
    },
    {
      tone: totalTransfers > 500 ? "warn" : "neutral",
      title: "Property transfers registered",
      value: totalTransfers > 0 ? totalTransfers.toLocaleString() : "3,456",
      sub: "Total active transfer records",
    },
    {
      tone: growthGap > 10 ? "danger" : "warn",
      title: "Price-income divergence trend",
      value: bubbleData?.trend === "increasing" ? "↑ Increasing" : "→ Stable",
      sub: bubbleData?.interpretation?.concerns ?? "Monitor closely",
    },
    {
      tone: riskScore > 80 ? "danger" : "warn",
      title: "Overall bubble risk",
      value: `${riskScore}/100`,
      sub: bubbleData?.interpretation?.recommendation ?? "Monitor closely",
    },
  ];

  // ── City-level risk from /api/dashboard/regional-data ─────
  const cities = useMemo(() => {
    if (regionalData.length === 0) {
      return [
        { city: "Belgrade", risk: 78, price: "+18.4%", income: "+4.2%", div: "4.4x", status: "high", disputes: 2 },
        { city: "Južna Bačka", risk: 72, price: "+22.1%", income: "+5.1%", div: "4.3x", status: "high", disputes: 1 },
        { city: "Nišava", risk: 45, price: "+8.2%", income: "+4.8%", div: "1.7x", status: "medium", disputes: 0 },
        { city: "Šumadija", risk: 38, price: "+6.5%", income: "+3.9%", div: "1.7x", status: "low", disputes: 0 },
        { city: "Severna Bačka", risk: 52, price: "+12.4%", income: "+4.5%", div: "2.8x", status: "medium", disputes: 0 },
      ];
    }

    return regionalData.map((r) => {
      const disputeRatio = r.parcels > 0 ? r.disputes / r.parcels : 0;
      const verifRate = parseFloat(r.verificationRate ?? 0);
      // Scale-invariant formula: national riskScore as base, local dispute ratio
      // and verification quality as adjustments. Works correctly at any DB size.
      // Thresholds aligned to PPT Slide 3 BRI zones (>80 Crisis, >60 Elevated, else Watch)
      const regionRisk = Math.min(
        100,
        Math.max(0, Math.round(riskScore * 0.8 + (disputeRatio * 200) - 10 + (100 - verifRate) * 0.3))
      );
      const regionDiv = parseFloat((priceGrowth / incomeGrowth).toFixed(1));
      const riskStatus = regionRisk > 80 ? "high" : regionRisk > 60 ? "medium" : "low";

      return {
        city: r.region,
        risk: regionRisk,
        price: `+${priceGrowth}%`,
        income: `+${incomeGrowth}%`,
        div: `${regionDiv}x`,
        status: riskStatus,
        disputes: r.disputes ?? 0,
      };
    });
  }, [regionalData, riskScore, priceGrowth, incomeGrowth]);

  const regionOptions = useMemo(() => {
    const set = new Set(cities.map((c) => c.city).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [cities]);

  const actions = [
    {
      title: bubbleData?.interpretation?.recommendation ?? "Tighten LTV norms in overheated regions",
      priority: "High",
    },
    { title: "Freeze subsidies in overheated zones", priority: "High" },
    { title: "Increase registration scrutiny for repeat buyers", priority: "High" },
    { title: "Monitor foreign investment inflows", priority: "Medium" },
  ];

  const filteredCities = useMemo(() => {
    const q = query.trim().toLowerCase();

    return cities.filter((r) => {
      const matchText =
        !q ||
        r.city.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.div.toLowerCase().includes(q);

      const matchStatus = status === "all" ? true : r.status === status;
      const matchRegion = region === "all" ? true : r.city === region;

      return matchText && matchStatus && matchRegion;
    });
  }, [cities, query, status, region]);

  const onPointEnter = (e, title, value) => tip.show(e, title, value);
  const onPointLeave = () => tip.hide();

  return (
    <div id="brxBubbleRisk" className="brxPage">
      <div className="brxTopLine" />

      {/* App bar (Return card stays here like reference image) */}
      <div className="brxAppBar" role="banner" aria-label="Bubble Protection App Bar">
        <button className="brxAppBack" type="button" onClick={() => navigate(-1)}>
          <BrxIcon.Back className="brxBackIcon" />
          Return
        </button>

        <div className="brxBrandPill" aria-label="Bubble Protection Dashboard">
          <span className="brxBrandDot" aria-hidden="true" />
          <div className="brxBrandText">
            <div className="brxBrandTitle">Bubble Protection</div>
            <div className="brxBrandSub">Dashboard</div>
          </div>
        </div>

        <div className="brxAppIcons" aria-label="Quick actions">
          <button className="brxIconBtn" type="button" aria-label="Notifications">
            <BrxIcon.Bell className="brxIconSvg" />
            <span className="brxNotifDot" aria-hidden="true" />
          </button>
          <button className="brxIconBtn" type="button" aria-label="Profile">
            <BrxIcon.User className="brxIconSvg" />
          </button>
        </div>
      </div>

      <div className="brxWrap">
        <header className="brxHeader">
          <div className="brxHeaderTop">
            <div className="brxBadge">
              <BrxIcon.Shield className="brxBadgeIcon" />
              <span>Bubble Protection</span>
            </div>

            {loading ? <span className="brxLoading">Loading…</span> : null}
          </div>

          <h1 className="brxTitle">Bubble Protection Dashboard</h1>
          <p className="brxSub">Detect speculative bubbles before they become financial crises</p>
        </header>

        {/* Filters (AFTER heading like reference) */}
        <section className="brxFilterBar" aria-label="Filters">
          <div className="brxFilterBarTop">
            <div className="brxFilterTitle">
              <BrxIcon.Filter className="brxFilterTitleIcon" />
              <span>Filters</span>
            </div>
          </div>

          <div className="brxFilterRow">
            <div className="brxCtrl brxCtrl_search">
              <BrxIcon.Search className="brxCtrlIcon" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="brxInput"
                placeholder="Search by ID or name..."
                aria-label="Search"
              />
              {query ? (
                <button
                  className="brxClearBtn"
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>

            <div className="brxCtrl">
              <select
                className="brxSelect"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                aria-label="Filter by region"
              >
                {regionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "all" ? "All Regions" : opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="brxCtrl brxCtrl_date">
              <BrxIcon.Calendar className="brxCtrlIcon" />
              <select
                className="brxSelect"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                aria-label="Filter by date range"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>

            <div className="brxCtrl brxCtrl_status">
              <select
                className="brxSelect"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="high">High risk</option>
                <option value="medium">Medium risk</option>
                <option value="low">Low risk</option>
              </select>
            </div>
          </div>

          <div className="brxFilterRow2">
            <button className="brxResetBtn" type="button" onClick={resetFilters}>
              ✕ Reset filters
            </button>
          </div>
        </section>

        <section className="brxKpiGrid">
          {kpis.map((k, i) => (
            <BrxKpi key={i} {...k} />
          ))}
        </section>

        <section className="brxMainGrid">
          <div className="brxCard">
            <div className="brxCardHead">
              <h3 className="brxCardTitle">Price vs Income Growth Divergence</h3>
              <p className="brxCardHint">
                Showing trend for <b>Last {dateRange} days</b>
              </p>
            </div>

            <div
              className="brxCardBody brxChartBody"
              ref={tip.wrapRef}
              onMouseMove={tip.move}
              onMouseLeave={tip.hide}
            >
              <BrxLineChart
                labels={labels}
                series={series}
                yMin={0}
                yMax={20}
                onPointEnter={onPointEnter}
                onPointLeave={onPointLeave}
              />
              {tip.TooltipEl}
            </div>
          </div>

          <div className="brxCard">
            <div className="brxCardHead">
              <div className="brxCardHeadRow">
                <h3 className="brxCardTitle">AI Forecast Panel</h3>
                <span className="brxAiIcon">
                  <BrxIcon.Target className="brxSvgIcon" />
                </span>
              </div>
            </div>

            <div className="brxCardBody">
              <BrxProgress label="6-Month Risk Score" value={ai_tables.six} tone="warn" />
              <div className="brxDivider" />
              <BrxProgress label="12-Month Risk Score" value={ai_tables.twelve} tone="danger" />
              <div className="brxDivider" />

              <div className="brxAiChips">
                <div className="brxAiChip brxAiChip_danger">
                  <div className="brxAiChipValue">{ai_tables.correctionProb}%</div>
                  <div className="brxAiChipLabel">Correction Probability</div>
                </div>
                <div className="brxAiChip brxAiChip_warn">
                  <div className="brxAiChipValue">{ai_tables.liquidityStress}%</div>
                  <div className="brxAiChipLabel">Liquidity Stress</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="brxCard brxMt">
          <div className="brxCardHead">
            <div className="brxCardHeadRow">
              <h3 className="brxCardTitle">Market Stress Signals</h3>
              <span className="brxWarnDot" aria-hidden="true">
                !
              </span>
            </div>
          </div>

          <div className="brxStressGrid">
            {stressSignals.map((s, i) => (
              <BrxStress key={i} {...s} />
            ))}
          </div>
        </section>

        <section className="brxCard brxMt">
          <div className="brxCardHead">
            <div className="brxCardHeadRow">
              <h3 className="brxCardTitle">City-Level Bubble Risk Assessment</h3>

              <div className="brxTableMeta">
                <span className="brxCount">
                  Showing <b>{filteredCities.length}</b> / {cities.length}
                </span>
              </div>
            </div>
          </div>

          <div className="brxTableWrap">
            <table className="brxTable">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Risk Score</th>
                  <th>Price Growth</th>
                  <th>Income Growth</th>
                  <th>Divergence</th>
                  <th>Dispute</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.map((r, i) => (
                  <tr key={i}>
                    <td className="brxCity">{r.city}</td>
                    <td>
                      <div className="brxRiskCell">
                        <BrxMiniBar value={r.risk} />
                        <span className="brxRiskNum">{r.risk}</span>
                      </div>
                    </td>
                    <td className="brxNeg">{r.price}</td>
                    <td className="brxPos">{r.income}</td>
                    <td className="brxDiv">{r.div}</td>
                    <td>
                      {Number(r.disputes) > 0 ? (
                        <BrxBadgePill tone="dispute" text={`Dispute (${r.disputes})`} />
                      ) : (
                        <BrxBadgePill tone="ok" text="No Dispute" />
                      )}
                    </td>
                    <td>
                      {r.status === "high" ? (
                        <BrxRiskPill tone="high" text="high risk" />
                      ) : r.status === "medium" ? (
                        <BrxRiskPill tone="med" text="medium risk" />
                      ) : (
                        <BrxRiskPill tone="low" text="low risk" />
                      )}
                    </td>
                  </tr>
                ))}

                {filteredCities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="brxEmpty">
                      No results found. Try a different search or filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="brxCard brxMt">
          <div className="brxCardHead">
            <div className="brxCardHeadRow">
              <h3 className="brxCardTitle">Recommended Regulator Actions</h3>
              <span className="brxSpark">
                <BrxIcon.Spark className="brxSvgIcon" />
              </span>
            </div>
            <p className="brxCardHint">AI-generated policy recommendations based on current indicators</p>
          </div>

          <div className="brxActionsGrid">
            {actions.map((a, i) => (
              <div key={i} className="brxActionCard">
                <span className="brxActionDot" aria-hidden="true" />
                <div>
                  <div className="brxActionTitle">{a.title}</div>
                  <div className="brxActionMeta">Priority: {a.priority}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="brxBtns">
            <button className="brxBtn brxBtn_primary" type="button">
              Generate Detailed Report
            </button>
            <button className="brxBtn brxBtn_secondary" type="button">
              Schedule Review Meeting
            </button>
          </div>
        </section>

        {/* Footer (added at last of this page) */}
        <footer className="brxFooter" aria-label="Footer">
          <div className="brxFooterInner">
            <span>Bubble Protection • Market Surveillance</span>
            <span className="brxFooterDot">•</span>
            <span>Data refresh: {loading ? "loading…" : "live"}</span>
            <span className="brxFooterDot">•</span>
            <span>© {new Date().getFullYear()} RegistryGuard</span>
          </div>
        </footer>

        <div className="brxSpacer" />
      </div>
    </div>
  );
}