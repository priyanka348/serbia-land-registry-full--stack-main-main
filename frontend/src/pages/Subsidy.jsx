// Subsidy.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Subsidy.css";
import Header from "../components/Header";
// ❌ Sidebar removed for full-page view
// import Navbar from "../components/Navbar";
import { fetchSubsidyData, fetchDashboardStats } from "../utils/api";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const Currency = ({ value }) => {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `€${num.toFixed(1)}M`;
};

const Percent = ({ value, decimals = 1 }) => {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${num.toFixed(decimals)}%`;
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// ── Static label structures ─────────────────────────────────
const INCOME_BRACKETS = [
  { bracket: "< €5,000", defaultAllocated: 28.5, defaultUtilized: 24.8 },
  { bracket: "€5,000 – €10,000", defaultAllocated: 35.2, defaultUtilized: 28.1 },
  { bracket: "€10,000 – €15,000", defaultAllocated: 22.8, defaultUtilized: 16.2 },
  { bracket: "€15,000 – €20,000", defaultAllocated: 8.5, defaultUtilized: 5.1 },
  { bracket: "> €20,000", defaultAllocated: 3.5, defaultUtilized: 2.0 },
];

const CITY_LABELS = [
  { city: "Belgrade", defaultBudget: 45.0, defaultUtilized: 38.0 },
  { city: "Južna Bačka", defaultBudget: 18.0, defaultUtilized: 14.5 },
  { city: "Nišava", defaultBudget: 12.0, defaultUtilized: 9.0 },
  { city: "Šumadija", defaultBudget: 9.0, defaultUtilized: 6.8 },
  { city: "Severna Bačka", defaultBudget: 8.5, defaultUtilized: 6.5 },
  { city: "Raška", defaultBudget: 7.5, defaultUtilized: 5.5 },
  { city: "Zlatibor", defaultBudget: 6.5, defaultUtilized: 4.8 },
  { city: "Srem", defaultBudget: 6.0, defaultUtilized: 4.5 },
  { city: "Mačva", defaultBudget: 5.5, defaultUtilized: 4.0 },
  { city: "Rasina", defaultBudget: 5.0, defaultUtilized: 3.6 },
  { city: "Pomoravlje", defaultBudget: 4.5, defaultUtilized: 3.2 },
  { city: "Zapadna Bačka", defaultBudget: 4.0, defaultUtilized: 2.9 },
  { city: "Braničevo", defaultBudget: 3.8, defaultUtilized: 2.6 },
  { city: "Jablanica", defaultBudget: 3.5, defaultUtilized: 2.4 },
  { city: "Moravica", defaultBudget: 3.2, defaultUtilized: 2.2 },
  { city: "Kolubara", defaultBudget: 3.0, defaultUtilized: 2.0 },
  { city: "Južni Banat", defaultBudget: 2.8, defaultUtilized: 1.9 },
  { city: "Srednji Banat", defaultBudget: 2.6, defaultUtilized: 1.7 },
  { city: "Podunavlje", defaultBudget: 2.4, defaultUtilized: 1.6 },
  { city: "Severni Banat", defaultBudget: 2.2, defaultUtilized: 1.5 },
  { city: "Toplica", defaultBudget: 2.0, defaultUtilized: 1.3 },
  { city: "Pčinja", defaultBudget: 1.9, defaultUtilized: 1.2 },
  { city: "Bor", defaultBudget: 1.8, defaultUtilized: 1.1 },
  { city: "Zaječar", defaultBudget: 1.7, defaultUtilized: 1.0 },
  { city: "Pirot", defaultBudget: 1.5, defaultUtilized: 0.9 },
];

const ELIGIBILITY_DEFAULTS = [
  { bracket: "< €5,000", allocated: 28.5, utilized: 24.8, beneficiaries: 4850, utilizationPct: 87, leakagePct: 1.8 },
  { bracket: "€5,000 – €10,000", allocated: 35.2, utilized: 28.1, beneficiaries: 4200, utilizationPct: 80, leakagePct: 2.4 },
  { bracket: "€10,000 – €15,000", allocated: 22.8, utilized: 16.2, beneficiaries: 2400, utilizationPct: 71, leakagePct: 4.2 },
  { bracket: "€15,000 – €20,000", allocated: 8.5, utilized: 5.1, beneficiaries: 780, utilizationPct: 60, leakagePct: 5.8 },
  { bracket: "> €20,000", allocated: 3.5, utilized: 2.0, beneficiaries: 220, utilizationPct: 57, leakagePct: 8.1 },
];

// basic region → city mapping (for filter logic)
const REGION_CITY_MAP = {
  all: null,
  belgrade: new Set(["Belgrade"]),
  vojvodina: new Set([
    "Južna Bačka",
    "Severna Bačka",
    "Zapadna Bačka",
    "Srednji Banat",
    "Severni Banat",
    "Južni Banat",
    "Srem",
  ]),
  sumadija: new Set(["Šumadija", "Kolubara", "Mačva", "Pomoravlje", "Rasina", "Braničevo", "Podunavlje", "Moravica"]),
  south: new Set(["Nišava", "Jablanica", "Toplica", "Pčinja", "Pirot", "Bor", "Zaječar", "Raška", "Zlatibor"]),
};

export default function Subsidy() {
  const navigate = useNavigate();

  // Toggle global app header for this page (you asked to remove Serbia Land Registry header completely)
  const SHOW_GLOBAL_HEADER = false;

  // ── Filter UI State ───────────────────────────────────────
  const [filterQuery, setFilterQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterRange, setFilterRange] = useState("30"); // 7 | 30 | 90

  const resetFilters = () => {
    setFilterQuery("");
    setFilterRegion("all");
    setFilterRange("30");
  };

  // ── API State ─────────────────────────────────────────────
  const [subsidyData, setSubsidyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([fetchSubsidyData(), fetchDashboardStats()])
      .then(([subRes]) => {
        if (subRes.status === "fulfilled") setSubsidyData(subRes.value?.data ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const goBack = () => {
    const prev = sessionStorage.getItem("prev_path");
    if (prev) navigate(prev);
    else navigate("/overview");
  };

  const goMainDashboard = () => {
    navigate("/overview");
  };

  // ── Range “logic” (applies to derived anomaly volumes) ────
  const rangeMultiplier = useMemo(() => {
    const r = Number(filterRange);
    if (r === 7) return 0.45;   // smaller window = fewer cases
    if (r === 90) return 1.65;  // bigger window = more cases
    return 1.0;                // 30 days baseline
  }, [filterRange]);

  // ── Core KPIs ─────────────────────────────────────────────
  const totalAllocatedRaw = subsidyData?.totalAllocated ?? 125000000;
  const totalDisbursedRaw = subsidyData?.totalDisbursed ?? 76200000;
  const leakageRate = subsidyData?.leakageRate ?? 3.2;
  const fraudCount = subsidyData?.fraudulentCases ?? 80;
  const totalApplications = subsidyData?.totalApplications ?? 12450;
  const completedApps = subsidyData?.completedApplications ?? 8920;

  // Convert raw EUR → millions for display
  const totalBudgetM = parseFloat((totalAllocatedRaw / 1_000_000).toFixed(1));
  const allocatedM = parseFloat((totalAllocatedRaw / 1_000_000).toFixed(1));
  const utilizedM = parseFloat((totalDisbursedRaw / 1_000_000).toFixed(1));
  const allocatedPct = totalBudgetM > 0 ? (allocatedM / totalBudgetM) * 100 : 0;
  const utilizedPct = allocatedM > 0 ? (utilizedM / allocatedM) * 100 : 0;

  const kpis = useMemo(
    () => ({
      totalBudget: totalBudgetM,
      allocated: allocatedM,
      utilized: utilizedM,
      leakagePct: leakageRate,
    }),
    [totalBudgetM, allocatedM, utilizedM, leakageRate]
  );

  // ── byProgram aggregate totals for scaling ────────────────
  const byProgram = subsidyData?.byProgram ?? [];
  const apiTotalAllocated = byProgram.reduce((s, p) => s + (p.allocated || 0), 0);
  const apiTotalDisbursed = byProgram.reduce((s, p) => s + (p.disbursed || 0), 0);
  const hasApiData = byProgram.length > 0 && apiTotalAllocated > 0;

  // ── Income Bracket Chart ──────────────────────────────────
  const incomeDataRaw = useMemo(() => {
    if (hasApiData) {
      const defaultTotalAlloc = INCOME_BRACKETS.reduce((s, b) => s + b.defaultAllocated, 0);
      const defaultTotalUtil = INCOME_BRACKETS.reduce((s, b) => s + b.defaultUtilized, 0);
      const allocRatio = apiTotalAllocated / 1_000_000 / defaultTotalAlloc;
      const utilRatio = apiTotalDisbursed / 1_000_000 / defaultTotalUtil;
      return INCOME_BRACKETS.map((b) => ({
        bracket: b.bracket,
        allocated: parseFloat((b.defaultAllocated * allocRatio).toFixed(1)),
        utilized: parseFloat((b.defaultUtilized * utilRatio).toFixed(1)),
      }));
    }
    return INCOME_BRACKETS.map((b) => ({
      bracket: b.bracket,
      allocated: b.defaultAllocated,
      utilized: b.defaultUtilized,
    }));
  }, [hasApiData, apiTotalAllocated, apiTotalDisbursed]);

  const incomeData = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return incomeDataRaw;
    return incomeDataRaw.filter((x) => String(x.bracket).toLowerCase().includes(q));
  }, [incomeDataRaw, filterQuery]);

  // ── City Chart ────────────────────────────────────────────
  const cityDataRaw = useMemo(() => {
    if (hasApiData) {
      const defaultTotalBudget = CITY_LABELS.reduce((s, c) => s + c.defaultBudget, 0);
      const defaultTotalUtil = CITY_LABELS.reduce((s, c) => s + c.defaultUtilized, 0);
      const budgetRatio = apiTotalAllocated / 1_000_000 / defaultTotalBudget;
      const utilRatio = apiTotalDisbursed / 1_000_000 / defaultTotalUtil;
      return CITY_LABELS.map((c) => ({
        city: c.city,
        budget: parseFloat((c.defaultBudget * budgetRatio).toFixed(1)),
        utilized: parseFloat((c.defaultUtilized * utilRatio).toFixed(1)),
      }));
    }
    return CITY_LABELS.map((c) => ({
      city: c.city,
      budget: c.defaultBudget,
      utilized: c.defaultUtilized,
    }));
  }, [hasApiData, apiTotalAllocated, apiTotalDisbursed]);

  const cityData = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const regionSet = REGION_CITY_MAP[filterRegion] || null;

    return cityDataRaw.filter((c) => {
      const okRegion = regionSet ? regionSet.has(c.city) : true;
      const okQuery = q ? String(c.city).toLowerCase().includes(q) : true;
      return okRegion && okQuery;
    });
  }, [cityDataRaw, filterQuery, filterRegion]);

  // ── Dispute / Status Helpers ──────────────────────────────
  const isDisputeLeakage = Number(kpis.leakagePct) > 2.5;
  const leakageStatusClass = isDisputeLeakage ? "statusBad" : "statusGood";
  const fraudStatusClass = (fraudCount ?? 0) > 0 ? "statusBad" : "statusGood";

  // ── Red Flags (range logic applied) ────────────────────────
  const fraudBase = Math.max(1, Math.round(((fraudCount > 0 ? fraudCount : 80) * rangeMultiplier)));
  const redFlags = useMemo(
    () => [
      { title: "Premium property subsidy", cases: Math.round(fraudBase * 0.56), amount: `€${Math.round(fraudBase * 0.56 * 19.8)}K` },
      { title: "Repeated beneficiary", cases: Math.round(fraudBase * 0.29), amount: `€${Math.round(fraudBase * 0.29 * 19.8)}K` },
      { title: "False documentation", cases: Math.round(fraudBase * 0.15), amount: `€${Math.round(fraudBase * 0.15 * 28.3)}K` },
    ],
    [fraudBase]
  );

  // ── Outcome Tracking ──────────────────────────────────────
  const deliveredUnits = completedApps || 8920;
  const subsidizedTotal = totalApplications || 12450;
  const deliveryRateVal =
    subsidizedTotal > 0 ? parseFloat(((deliveredUnits / subsidizedTotal) * 100).toFixed(1)) : 71.6;

  const outcome = useMemo(
    () => ({
      unitsDelivered: deliveredUnits,
      totalSubsidized: subsidizedTotal,
      deliveryRate: deliveryRateVal,
      deliveryDelta: 2.4,
      satisfaction: 7.8,
    }),
    [deliveredUnits, subsidizedTotal, deliveryRateVal]
  );

  // ── Eligibility Matrix ────────────────────────────────────
  const eligibilityRowsRaw = useMemo(() => {
    if (hasApiData) {
      const defaultTotalAlloc = ELIGIBILITY_DEFAULTS.reduce((s, r) => s + r.allocated, 0);
      const defaultTotalUtil = ELIGIBILITY_DEFAULTS.reduce((s, r) => s + r.utilized, 0);
      const defaultTotalBene = ELIGIBILITY_DEFAULTS.reduce((s, r) => s + r.beneficiaries, 0);
      const allocRatio = apiTotalAllocated / 1_000_000 / defaultTotalAlloc;
      const utilRatio = apiTotalDisbursed / 1_000_000 / defaultTotalUtil;
      const beneRatio = totalApplications > 0 ? totalApplications / defaultTotalBene : 1;
      const apiLeakage = parseFloat(leakageRate);

      return ELIGIBILITY_DEFAULTS.map((r) => ({
        bracket: r.bracket,
        allocated: parseFloat((r.allocated * allocRatio).toFixed(1)),
        utilized: parseFloat((r.utilized * utilRatio).toFixed(1)),
        beneficiaries: Math.round(r.beneficiaries * beneRatio),
        utilizationPct:
          Math.min(100, Math.round(r.utilizationPct * (utilRatio / Math.max(allocRatio, 0.01)))) || r.utilizationPct,
        leakagePct: parseFloat((apiLeakage * (r.leakagePct / 3.2)).toFixed(1)) || r.leakagePct,
      }));
    }
    return ELIGIBILITY_DEFAULTS;
  }, [hasApiData, apiTotalAllocated, apiTotalDisbursed, totalApplications, leakageRate]);

  const eligibilityRows = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return eligibilityRowsRaw;
    return eligibilityRowsRaw.filter((r) => String(r.bracket).toLowerCase().includes(q));
  }, [eligibilityRowsRaw, filterQuery]);

  const leakageTone = (pct) => {
    if (pct <= 2.5) return "good";
    if (pct <= 5) return "warn";
    return "bad";
  };

  return (
    <>
      {/* Global Header removed for this page */}
      {SHOW_GLOBAL_HEADER && <Header />}

      {/* ❌ Navbar removed intentionally to open full page without sidebar */}

      <div id="slrSubsidyPageRoot" className="subsidyPage slrSubsidyPage">
        <div className="subsidyWrap">
          {/* Top bar (reference-style) */}
          <div className="topBar">
            <button className="returnBtn" onClick={goBack} type="button" aria-label="Return">
              <span className="returnArrow" aria-hidden="true">←</span>
              <span className="returnText">Return</span>
            </button>

            <div className="brandPill" role="banner" aria-label="Subsidy Efectiveness">
              <span className="brandMark" aria-hidden="true">◍</span>
              <div className="brandTxt">
                <div className="brandTitle">Subsidy Efectiveness</div>
                <div className="brandSub">Dashboard</div>
              </div>
            </div>

            <div className="topBarRight" aria-label="Header actions">
              <button className="iconBtn" type="button" aria-label="Notifications" title="Notifications">
                🔔
              </button>
              <button className="iconBtn" type="button" aria-label="Profile" title="Profile">
                👤
              </button>
            </div>
          </div>

          {/* Breadcrumb (kept but hidden as requested) */}
          <div className="crumbRow">
            <button className="crumbBackBtn" onClick={goBack} type="button" aria-label="Back">
              ←
            </button>

            <div className="crumbMid">
              <span className="crumbText">Policy Dashboard</span>
              <span className="crumbSep">/</span>
              <span className="crumbText strong">Subsidy Allocation</span>
              {loading ? <span className="crumbLoading">• Loading…</span> : null}
            </div>

            <button className="mainDashBtn" type="button" onClick={goMainDashboard}>
              Return to Main Dashboard
            </button>
          </div>

          {/* Hero */}
          <div className="hero serbHero">
            <div className="heroBadge">
              <span className="heroBadgeIcon">▦</span>
              <span>Subsidy Management</span>
            </div>

            <h1 className="heroTitle">Subsidy Allocation Dashboard</h1>
            <p className="heroSub">Precise, targeted, leak-proof, and politically defensible subsidies</p>
          </div>

          {/* Filters (reference-style) */}
          <div className="filterBar card">
            <div className="filterBarTop">
              <div className="filterTitle">
                <span className="filterIcon">⏷</span>
                <span>Filters</span>
              </div>
            </div>

            <div className="filterRow">
              <div className="filterField grow">
                <span className="fieldIcon">🔎</span>
                <input
                  className="filterInput"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Search by ID or name..."
                  aria-label="Search by ID or name"
                />
              </div>

              <div className="filterField">
                <select
                  className="filterSelect"
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  aria-label="Region"
                >
                  <option value="all">All Regions</option>
                  <option value="belgrade">Belgrade</option>
                  <option value="vojvodina">Vojvodina</option>
                  <option value="sumadija">Šumadija</option>
                  <option value="south">Southern Serbia</option>
                </select>
              </div>

              <div className="filterField">
                <span className="fieldIcon">📅</span>
                <select
                  className="filterSelect"
                  value={filterRange}
                  onChange={(e) => setFilterRange(e.target.value)}
                  aria-label="Date range"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>

            <div className="filterActions">
              <button className="resetFiltersBtn" type="button" onClick={resetFilters}>
                Reset filters
              </button>

              <div className="activeFilters">
                <span className="chip navy">Range: {filterRange}d</span>
                <span className="chip red">Region: {filterRegion === "all" ? "All" : filterRegion}</span>
                {filterQuery ? (
                  <span className="chip good">Query: “{filterQuery}”</span>
                ) : (
                  <span className="chip neutral">Query: —</span>
                )}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="kpiGrid">
            <div className="card kpiCard">
              <div className="kpiTop">
                <div className="kpiLabel">
                  <span className="kpiDot neutral">□</span>
                  <span>Total Budget</span>
                </div>
              </div>
              <div className="kpiValue">
                <Currency value={kpis.totalBudget} />
              </div>
              <div className="kpiMeta">FY {new Date().getFullYear()} Allocation</div>
            </div>

            <div className="card kpiCard tintBlue">
              <div className="kpiTop">
                <div className="kpiLabel">
                  <span className="kpiDot blue">◎</span>
                  <span>Allocated</span>
                </div>
              </div>
              <div className="kpiValue">
                <Currency value={kpis.allocated} />
              </div>
              <div className="kpiProgress">
                <div className="barTrack">
                  <div className="barFill blueFill" style={{ width: `${clamp(allocatedPct, 0, 100)}%` }} />
                </div>
                <div className="kpiFoot">
                  <span>
                    <Percent value={allocatedPct} /> of budget
                  </span>
                </div>
              </div>
            </div>

            <div className="card kpiCard tintGreen">
              <div className="kpiTop">
                <div className="kpiLabel">
                  <span className="kpiDot green">✓</span>
                  <span>Utilized</span>
                </div>
              </div>
              <div className="kpiValue">
                <Currency value={kpis.utilized} />
              </div>
              <div className="kpiProgress">
                <div className="barTrack">
                  <div className="barFill greenFill" style={{ width: `${clamp(utilizedPct, 0, 100)}%` }} />
                </div>
                <div className="kpiFoot">
                  <span>
                    <Percent value={utilizedPct} /> utilization rate
                  </span>
                </div>
              </div>
            </div>

            {/* Leakage KPI: Dispute (red) vs OK (green) */}
            <div className={`card kpiCard tintSerb ${leakageStatusClass}`}>
              <div className="kpiTop">
                <div className="kpiLabel">
                  <span className="kpiDot red">▲</span>
                  <span>Leakage</span>
                </div>
                <span className={`statusPill ${leakageStatusClass}`}>{isDisputeLeakage ? "Dispute" : "OK"}</span>
              </div>

              <div className="kpiValue">
                <Percent value={kpis.leakagePct} />
              </div>
              <div className="kpiMeta">{subsidyData?.interpretation?.leakageLevel ?? "Mismatch / fraud detected"}</div>
            </div>
          </div>

          {/* Charts */}
          <div className="twoCol">
            <div className="card sectionCard">
              <div className="sectionHead">
                <h3>Allocation by Income Bracket</h3>
                <p>Budget vs utilization across income levels (€M)</p>
              </div>

              <div className="chartBox">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={incomeData} barCategoryGap={16}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="bracket" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`€${Number(v).toFixed(1)}M`, ""]} />
                    <Legend />
                    <Bar dataKey="allocated" name="Allocated" fill="#0A2E73" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="utilized" name="Utilized" fill="#16a34a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card sectionCard">
              <div className="sectionHead">
                <h3>Allocation by City</h3>
                <p>Geographic distribution of subsidies (€M)</p>
              </div>

              <div className="chartBox">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={cityData} layout="vertical" barCategoryGap={14}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="city" tick={{ fontSize: 12 }} width={110} />
                    <Tooltip formatter={(v) => [`€${Number(v).toFixed(1)}M`, ""]} />
                    <Legend />
                    <Bar dataKey="budget" name="Budget" fill="#0A2E73" radius={[0, 10, 10, 0]} />
                    <Bar dataKey="utilized" name="Utilized" fill="#16a34a" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Red Flags */}
          <div className="card sectionCard">
            <div className="sectionHead">
              <div className="titleWithIcon">
                <span className="alertIcon">⚠</span>
                <div>
                  <h3>Subsidy Red Flags</h3>
                  <p>Anomalies and potential fraud indicators (range-aware)</p>
                </div>
              </div>

              <span className={`statusPill ${fraudStatusClass}`}>{(fraudCount ?? 0) > 0 ? "Dispute" : "OK"}</span>
            </div>

            <div className="flagGrid">
              {redFlags.map((f) => {
                const isDispute = (f.cases ?? 0) > 0;
                return (
                  <div className={`flagCard ${isDispute ? "dispute" : "ok"}`} key={f.title}>
                    <div className="flagTitle">
                      {f.title}
                      <span className={`miniStatus ${isDispute ? "bad" : "good"}`}>{isDispute ? "Dispute" : "OK"}</span>
                    </div>
                    <div className="flagRow">
                      <div className="flagCases">
                        <span className="flagNum">{f.cases}</span> <span className="flagSmall">cases</span>
                      </div>
                      <div className="flagAmt">{f.amount}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outcome Tracking */}
          <div className="card sectionCard">
            <div className="sectionHead">
              <h3>Outcome Tracking</h3>
              <p>Measuring subsidy effectiveness and impact</p>
            </div>

            <div className="outcomeGrid">
              <div className="miniCard mergedOutcome">
                <div className="mergedTop">
                  <div className="miniIcon green">◎</div>
                  <div className="mergedPct">{outcome.deliveryRate.toFixed(1)}%</div>
                </div>

                <div className="mergedLabel">Delivery Rate</div>
                <div className="mergedDelta">↗ +{outcome.deliveryDelta.toFixed(1)}% vs last year</div>

                <div className="mergedNums">
                  <div className="mergedNumItem">
                    <div className="mergedNum">{outcome.unitsDelivered.toLocaleString()}</div>
                    <div className="mergedSub">Delivered</div>
                  </div>

                  <div className="mergedDivider" />

                  <div className="mergedNumItem">
                    <div className="mergedNum">{outcome.totalSubsidized.toLocaleString()}</div>
                    <div className="mergedSub">Subsidized</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="satisfaction">
              <div className="satLeft">
                <span className="star">☆</span>
                <div className="satTitle">Beneficiary Satisfaction Score</div>
              </div>

              <div className="satRight">
                <div className="satScore">{outcome.satisfaction.toFixed(1)}/10</div>
                <div className="satBar">
                  <div className="satTrack">
                    <div className="satFill" style={{ width: `${clamp((outcome.satisfaction / 10) * 100, 0, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Eligibility Matrix */}
          <div className="card sectionCard">
            <div className="sectionHead">
              <h3>Eligibility Matrix</h3>
              <p>Cross-filter: Income × Property Size × Location × First-time buyer</p>
            </div>

            <div className="tableWrap">
              <table className="matrix">
                <thead>
                  <tr>
                    <th>Income Bracket</th>
                    <th>Allocated</th>
                    <th>Utilized</th>
                    <th>Beneficiaries</th>
                    <th>Utilization %</th>
                    <th>Leakage %</th>
                  </tr>
                </thead>

                <tbody>
                  {eligibilityRows.map((r) => {
                    const rowDispute = Number(r.leakagePct) > 2.5;
                    return (
                      <tr key={r.bracket} className={rowDispute ? "rowDispute" : "rowOk"}>
                        <td className="tdStrong">{r.bracket}</td>
                        <td>
                          <Currency value={r.allocated} />
                        </td>
                        <td>
                          <Currency value={r.utilized} />
                        </td>
                        <td>{r.beneficiaries.toLocaleString()}</td>
                        <td>
                          <div className="utilCell">
                            <div className="utilTrack">
                              <div className="utilFill" style={{ width: `${clamp(r.utilizationPct, 0, 100)}%` }} />
                            </div>
                            <div className="utilPct">{r.utilizationPct}%</div>
                          </div>
                        </td>
                        <td>
                          <span className={`pill ${leakageTone(r.leakagePct)} ${rowDispute ? "pillDispute" : "pillOk"}`}>
                            {r.leakagePct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pageFooterPad" />

          {/* Footer */}
          <footer className="appFooter" role="contentinfo">
            <div className="appFooterInner">
              <div className="footLeft">
                <div className="footTitle">Subsidy Efectiveness Dashboard</div>
                <div className="footSub">Monitoring allocation, utilization, and leakage — with range-aware anomaly signals.</div>
              </div>
              <div className="footRight">
                <span className="footChip">© {new Date().getFullYear()}</span>
                {loading ? <span className="footChip">Syncing…</span> : <span className="footChip">Live</span>}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}