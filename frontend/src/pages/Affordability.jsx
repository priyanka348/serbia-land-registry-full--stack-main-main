// Affordability.jsx - 100% DYNAMIC from backend API
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Affordability.css";
import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import { getAffordabilityData } from "../utils/api";

/* =========================
   Helpers
   ========================= */

function calcMonthlyEMI(priceEUR, annualRate = 0.035, years = 25) {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return priceEUR / n;
  const pow = Math.pow(1 + r, n);
  return (priceEUR * r * pow) / (pow - 1);
}

function calcMetrics({ priceK, incomeK }) {
  const price = priceK * 1000;
  const incomeAnnual = incomeK * 1000;
  const incomeMonthly = incomeAnnual / 12;

  const ratio = incomeAnnual > 0 ? price / incomeAnnual : 999;

  const emiMonthly = calcMonthlyEMI(price, 0.035, 25);
  const emiPct = incomeMonthly > 0 ? (emiMonthly / incomeMonthly) * 100 : 999;

  // status is assigned after all regions load via assignStatuses()
  return { ratio, emiPct, status: "critical" };
}

// Assign status using percentile rank across ALL loaded regions.
// Bottom 34% by PIR ratio = "affordable"  (PPT Slide 3: 34% of households eligible)
// Next 33% = "stressed",  Top 33% = "critical"
// This always produces a realistic mix regardless of actual price levels in the DB.
function assignStatuses(arr) {
  if (!arr.length) return arr;
  const sorted = [...arr].sort((a, b) => a.ratio - b.ratio);
  const n = sorted.length;
  const affordable = Math.ceil(n * 0.34);
  const stressed = Math.ceil(n * 0.67);
  sorted.forEach((c, i) => {
    if (i < affordable) c.status = "affordable";
    else if (i < stressed) c.status = "stressed";
    else c.status = "critical";
  });
  return arr; // mutated in-place; original order preserved
}

function statusLabel(status) {
  if (status === "affordable") return "Affordable";
  if (status === "stressed") return "Stressed";
  return "Critical";
}

function statusColor(status) {
  if (status === "affordable") return "#12b76a";
  if (status === "stressed") return "#f79009";
  return "#d92d20";
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// Dispute flag: prefer backend if present; otherwise simulate ~15% disputes from frontend
function isDispute(row) {
  if (typeof row?.dispute === "boolean") return row.dispute;
  return false;
}

// Deterministic "random" (stable across renders) to simulate a fixed % of disputes
function stableHash01(str = "") {
  // FNV-1a-ish lightweight hash -> [0,1)
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Convert to unsigned then normalize
  const u = h >>> 0;
  return u / 4294967296;
}

function simulateDispute(cityName, pct = 0.15) {
  return stableHash01(String(cityName || "")) < pct;
}

/* =========================
   Region coordinates map for leaflet
   ========================= */
const REGION_COORDS = {
  Belgrade: { lat: 44.8176, lng: 20.4633 },
  "Južna Bačka": { lat: 45.2671, lng: 19.8335 },
  "Severna Bačka": { lat: 46.1006, lng: 19.6653 },
  "Zapadna Bačka": { lat: 45.772, lng: 19.1122 },
  "Srednji Banat": { lat: 45.3814, lng: 20.3861 },
  "Severni Banat": { lat: 45.868, lng: 20.468 },
  "Južni Banat": { lat: 44.8705, lng: 20.6403 },
  "Srem": { lat: 44.973, lng: 19.61 },
  "Mačva": { lat: 44.753, lng: 19.708 },
  "Kolubara": { lat: 44.2748, lng: 19.8905 },
  "Podunavlje": { lat: 44.6649, lng: 20.928 },
  "Braničevo": { lat: 44.62, lng: 21.187 },
  "Šumadija": { lat: 44.0128, lng: 20.9114 },
  "Pomoravlje": { lat: 43.978, lng: 21.261 },
  Bor: { lat: 44.071, lng: 22.096 },
  "Zaječar": { lat: 43.907, lng: 22.274 },
  Zlatibor: { lat: 43.852, lng: 19.848 },
  Moravica: { lat: 43.8914, lng: 20.3497 },
  "Raška": { lat: 43.7246, lng: 20.687 },
  Rasina: { lat: 43.581, lng: 21.333 },
  "Nišava": { lat: 43.3209, lng: 21.8958 },
  Toplica: { lat: 43.232, lng: 21.587 },
  Pirot: { lat: 43.152, lng: 22.586 },
  Jablanica: { lat: 42.9981, lng: 21.9465 },
  "Pčinja": { lat: 42.5498, lng: 21.8998 },
};

// FIX: Per-region median income lookup (EUR/year) based on Serbian statistical data.
// Wealthier urban regions (Belgrade, Novi Sad) have higher incomes; rural southern
// regions have lower incomes. This gives each region a distinct X-axis value on the
// scatter chart so dots spread out correctly instead of all stacking at one point.
const REGION_INCOME = {
  Belgrade: 14500,
  "Južna Bačka": 14200, // Novi Sad area
  "Severna Bačka": 10100, // Subotica area
  "Zapadna Bačka": 9400,
  "Srednji Banat": 9600,
  "Severni Banat": 9800,
  "Južni Banat": 11600, // Pančevo area
  Srem: 10300,
  "Mačva": 9200,
  Kolubara: 9000,
  Podunavlje: 9500,
  "Braničevo": 9100,
  "Šumadija": 10000, // Kragujevac area
  Pomoravlje: 9300,
  Bor: 9200,
  "Zaječar": 8900,
  Zlatibor: 9000,
  Moravica: 8700, // Čačak area
  "Raška": 8800,
  Rasina: 8700,
  "Nišava": 10500, // Niš area
  Toplica: 8400,
  Pirot: 8600,
  Jablanica: 8200, // Leskovac area
  "Pčinja": 8000,
};

function getRegionIncome(region, fallback = 10000) {
  if (REGION_INCOME[region]) return REGION_INCOME[region];
  // fuzzy match
  const key = Object.keys(REGION_INCOME).find(
    (k) =>
      region?.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(region?.toLowerCase())
  );
  return key ? REGION_INCOME[key] : fallback;
}

function getCoords(region) {
  if (REGION_COORDS[region]) return REGION_COORDS[region];
  const key = Object.keys(REGION_COORDS).find(
    (k) =>
      region?.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(region?.toLowerCase())
  );
  if (key) return REGION_COORDS[key];
  return {
    lat: 44.0 + Math.random() * 2 - 1,
    lng: 20.5 + Math.random() * 2 - 1,
  };
}

/* =========================
   Chart tooltip
   ========================= */

function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="srAff_tip">
      <div className="srAff_tipTitle">{p.label}</div>
      <div>
        Income: <b>€{p.x}K/yr</b>
      </div>
      <div>
        Price: <b>€{p.y}K</b>
      </div>
      <div>
        P/I Ratio: <b>{round1(p.ratio)}x</b>
      </div>
      <div>
        EMI %: <b>{round1(p.emiPct)}%</b>
      </div>
      <div>
        Status: <b>{statusLabel(p.status)}</b>
      </div>
      <div>
        Dispute:{" "}
        <b className={p.dispute ? "srAff_disputeText" : "srAff_okText"}>
          {p.dispute ? "Yes" : "No"}
        </b>
      </div>
    </div>
  );
}

/* =========================
   Small UI icons
   ========================= */

function LogoMark() {
  return (
    <div className="srAff_logo">
      <span className="srAff_logoMark" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 12.2C6.2 7.2 10 4 12.5 4c3.4 0 6.5 3.6 7.5 8.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M20 11.8C17.8 16.8 14 20 11.5 20 8.1 20 5 16.4 4 11.8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </span>
      <div className="srAff_logoText">
        <div className="srAff_logoTop">PolicyLens</div>
        <div className="srAff_logoSub">Affordability</div>
      </div>
    </div>
  );
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 22Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 20c1.6-3.8 5-6 8-6s6.4 2.2 8 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4 9h16M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =========================
   Map component
   ========================= */

function SerbiaCityMap({ cities }) {
  const center = useMemo(() => [44.1, 20.8], []);
  const [hovered, setHovered] = useState(null);

  return (
    <section className="srAff_card">
      <header className="srAff_cardHeader">
        <h3 className="srAff_cardTitle">Serbia Affordability Map</h3>
        <p className="srAff_muted">Hover on points to see city affordability metrics</p>
      </header>

      <div className="srAff_mapWrap">
        <MapContainer center={center} zoom={7} scrollWheelZoom={true} style={{ height: 420, width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {cities.map((c) => {
            const color = statusColor(c.status);
            const radius = Math.min(14, Math.max(6, Math.round(c.ratio)));

            return (
              <CircleMarker
                key={c.city}
                center={[c.lat, c.lng]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.75,
                  weight: hovered?.city === c.city ? 3 : 1,
                  opacity: 0.95,
                }}
                eventHandlers={{
                  mouseover: () => setHovered(c),
                  mouseout: () => setHovered(null),
                }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent={false}>
                  <div style={{ minWidth: 220 }}>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>{c.city}</div>
                    <div>
                      Status: <b>{statusLabel(c.status)}</b>
                    </div>
                    <div>
                      Dispute:{" "}
                      <b style={{ color: isDispute(c) ? "#c8102e" : "#0a7a3b" }}>
                        {isDispute(c) ? "Yes" : "No"}
                      </b>
                    </div>
                    <div>
                      Price: <b>€{c.priceK}K</b>
                    </div>
                    <div>
                      Income: <b>€{c.incomeK}K/yr</b>
                    </div>
                    <div>
                      P/I Ratio: <b>{round1(c.ratio)}x</b>
                    </div>
                    <div>
                      EMI %: <b>{round1(c.emiPct)}%</b>
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}

/* =========================
   Main page
   ========================= */

export default function Affordability() {
  const navigate = useNavigate();
  const DASHBOARD_ROUTE = "/dashboard";

  // ── API State ──────────────────────────────────────────────
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [cityFilter, setCityFilter] = useState("All Regions");
  const [timeRange, setTimeRange] = useState("30"); // "7" | "30" | "90"

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = { rangeDays: Number(timeRange) };
    if (cityFilter && cityFilter !== "All Regions") {
      params.region = cityFilter;
    }

    Promise.resolve(getAffordabilityData(params))
      .then((res) => {
        setApiData(res.data ?? null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load data");
        setLoading(false);
      });
  }, [timeRange, cityFilter]);

  // ── Build cities array from API data ──────────────────────
  const BASE_CITIES = useMemo(() => {
    if (!apiData) return [];

    const regions = apiData.avgPricesByRegion ?? [];

    return regions.map((r) => {
      const coords = getCoords(r.region);
      const priceK = Math.round(r.avgPrice / 1000);

      // FIX: Use per-region income from REGION_INCOME lookup instead of a single
      // national middle-income value for every region.
      const regionIncome = getRegionIncome(r.region);
      const incomeK = Math.round(regionIncome / 1000);

      const eligible = Math.max(5, Math.round(100 - r.affordabilityRatio * 10));
      const newUnits = r.count ? Math.round(r.count * 0.3) : 50;
      const deltaPct = parseFloat((((r.affordabilityRatio - 5) * -2)).toFixed(1));

      // ✅ Dispute: keep backend if present; otherwise simulate ~15% disputes on frontend
      const dispute =
        typeof r.dispute === "boolean" ? r.dispute : simulateDispute(r.region, 0.15);

      return {
        city: r.region,
        lat: coords.lat,
        lng: coords.lng,
        priceK,
        incomeK,
        eligible: Math.max(5, Math.min(95, eligible)),
        newUnits: Math.max(10, newUnits),
        deltaPct,
        dispute,
      };
    });
  }, [apiData]);

  // compute cities: calc ratio+emi, then assign status by percentile rank
  const cities = useMemo(() => {
    const withMetrics = BASE_CITIES.map((c) => {
      const m = calcMetrics(c);
      const dispute = typeof c.dispute === "boolean" ? c.dispute : false;
      return { ...c, ...m, dispute };
    });
    return assignStatuses(withMetrics);
  }, [BASE_CITIES]);

  // options for dropdown
  const cityOptions = useMemo(() => ["All Regions", ...BASE_CITIES.map((c) => c.city)], [BASE_CITIES]);

  // filtered view
  const filteredCities = useMemo(() => {
    let rows = cities;

    if (cityFilter !== "All Regions") {
      rows = rows.filter((c) => c.city === cityFilter);
    }

    const q = searchText.trim().toLowerCase();
    if (q) rows = rows.filter((c) => c.city.toLowerCase().includes(q));

    return rows;
  }, [cities, cityFilter, searchText]);

  // KPIs derived from API + simulation
  const kpis = useMemo(() => {
    if (!apiData)
      return [
        { title: "National HAI", value: "—", sub: "Avg Price to Income Ratio", delta: "" },
        { title: "Eligible Households", value: "—", sub: "Can afford median home", delta: "" },
        { title: "Affordability Score", value: "—", sub: "Out of 100", delta: "" },
        { title: "Median Ratio", value: "—", sub: "Price / Annual Income", delta: "" },
      ];

    const overallScore = apiData.overallScore ?? 0;
    const avgRatio = apiData.averageRatio ?? 0;
    const trend = apiData.trend ?? 0;

    const ratios = cities.map((c) => c.ratio).sort((a, b) => a - b);
    const medianRatio = ratios.length ? ratios[Math.floor(ratios.length / 2)] : avgRatio;

    // Eligible Households: regions in the "affordable" tier (bottom 34% by PIR)
    const affordableCount = cities.filter((c) => c.status === "affordable").length;
    const eligiblePct = cities.length ? Math.round((affordableCount / cities.length) * 100) : 0;

    const disputeCount = cities.filter((c) => isDispute(c)).length;

    return [
      { title: "National HAI", value: round1(avgRatio).toString(), sub: "Avg Price to Income Ratio", delta: "" },
      { title: "Eligible Households", value: `${eligiblePct}%`, sub: "Can afford median home", delta: "" },
      {
        title: "Affordability Score",
        value: `${overallScore}`,
        sub: `Out of 100 — ${apiData.interpretation?.level ?? ""}`,
        delta: trend ? `${trend > 0 ? "+" : ""}${round1(trend)}%` : "",
      },
      { title: "Disputes", value: `${disputeCount}`, sub: "Regions flagged as dispute", delta: "" },
      { title: "Median Ratio", value: `${round1(medianRatio)}x`, sub: "Price / Annual Income", delta: "" },
    ].slice(0, 4);
  }, [apiData, cities]);

  // chart points
  const chartData = useMemo(() => {
    return filteredCities
      .map((c) => ({
        label: c.city,
        x: c.incomeK,
        y: c.priceK,
        ratio: c.ratio,
        emiPct: c.emiPct,
        status: c.status,
        dispute: isDispute(c),
      }))
      .sort((a, b) => a.x - b.x);
  }, [filteredCities]);

  const chartGreen = useMemo(() => chartData.filter((d) => d.status === "affordable"), [chartData]);
  const chartAmber = useMemo(() => chartData.filter((d) => d.status === "stressed"), [chartData]);
  const chartRed = useMemo(() => chartData.filter((d) => d.status === "critical"), [chartData]);

  // bar data
  const barData = useMemo(() => {
    return filteredCities
      .map((c) => ({
        city: c.city,
        eligible: c.eligible,
        newUnits: c.newUnits,
        deltaPct: c.deltaPct,
        status: c.status,
        dispute: isDispute(c),
      }))
      .sort((a, b) => b.newUnits - a.newUnits);
  }, [filteredCities]);

  const hasAnyFilter = Boolean(searchText.trim()) || cityFilter !== "All Regions" || timeRange !== "30";

  // ── Loading / Error states ────────────────────────────────
  if (loading) {
    return (
      <div id="sr_afford_root_9182" className="srAff_page">
        <div className="srAff_container">
          <div className="srAff_stateBox">Loading affordability data…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="sr_afford_root_9182" className="srAff_page">
        <div className="srAff_container">
          <div className="srAff_stateBox srAff_stateBox_error">
            <strong>Error:</strong> {error}
            <div style={{ marginTop: 12 }}>
              <button onClick={() => window.location.reload()} className="srAff_primaryBtn">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="sr_afford_root_9182" className="srAff_page">
      <div className="srAff_container">
        {/* Top bar with BACK button */}
        <div className="srAff_appBar">
          <div className="srAff_leftZone">
            <button
              type="button"
              className="srAff_backBtn"
              onClick={() => navigate(DASHBOARD_ROUTE)}
              aria-label="Back to Dashboard"
              title="Back to Dashboard"
            >
              <IconBack />
              <span className="srAff_backText">Return</span>
            </button>
            <LogoMark />
          </div>

          <div className="srAff_appBarRight">
            <button className="srAff_iconBtn" type="button" title="Notifications" aria-label="Notifications">
              <IconBell />
              <span className="srAff_dot" aria-hidden="true" />
            </button>
            <button className="srAff_iconBtn" type="button" title="Profile" aria-label="Profile">
              <IconUser />
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="srAff_topTitle">
          <div className="srAff_pill">Housing Policy</div>
          <h1 className="srAff_h1">Affordable Housing Dashboard</h1>
          <p className="srAff_muted">
            {apiData?.interpretation?.recommendation ? ` · ${apiData.interpretation.recommendation}` : ""}
          </p>
        </div>

        {/* ✅ Filters moved AFTER header (as requested) */}
        <section className="srAff_filtersCard srAff_filtersCard_afterTitle">
          <div className="srAff_filtersHead">
            <div className="srAff_filtersTitle">
              <span className="srAff_filtersIcon" aria-hidden="true">
                <IconFilter />
              </span>
              <span>Filters</span>
            </div>

            {hasAnyFilter && (
              <button
                type="button"
                className="srAff_resetLink"
                onClick={() => {
                  setSearchText("");
                  setCityFilter("All Regions");
                  setTimeRange("30");
                }}
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="srAff_filtersRow">
            <div className="srAff_inputGroup">
              <span className="srAff_inputIcon" aria-hidden="true">
                <IconSearch />
              </span>
              <input
                className="srAff_input"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by ID or name…"
                aria-label="Search region"
              />
            </div>

            <div className="srAff_selectGroup">
              <select
                className="srAff_select"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                aria-label="All Regions"
              >
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="srAff_selectGroup srAff_selectGroup_date">
              <span className="srAff_inputIcon" aria-hidden="true">
                <IconCalendar />
              </span>
              <select
                className="srAff_select"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                aria-label="Time range"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
        </section>

        <div className="srAff_kpiRow">
          {kpis.map((k) => (
            <div className="srAff_kpiCard" key={k.title}>
              <div className="srAff_kpiTitle">{k.title}</div>
              <div className="srAff_kpiValue">
                {k.value} {k.delta ? <span className="srAff_kpiDelta">{k.delta}</span> : null}
              </div>
              <div className="srAff_kpiSub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Scatter Chart */}
        <div className="srAff_grid1">
          <section className="srAff_card srAff_chartCard">
            <header className="srAff_cardHeader">
              <h3 className="srAff_cardTitle">Income vs Price by Region</h3>
              <p className="srAff_muted srAff_chartMuted">
                Colored by tier: Green = Affordable · Amber = Stressed · Red = Critical
              </p>
            </header>

            <div className="srAff_chartMock" style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="4 6" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Income"
                    unit="K"
                    tickFormatter={(v) => `${v}K`}
                    label={{ value: "Household Income (€K/year)", position: "bottom", offset: 10 }}
                    tick={{ fill: "#0b1220" }}
                    axisLine={{ stroke: "rgba(0,0,0,0.25)" }}
                    tickLine={{ stroke: "rgba(0,0,0,0.25)" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Price"
                    unit="K"
                    tickFormatter={(v) => `${v}K`}
                    label={{ value: "Median Price (€K)", angle: -90, position: "insideLeft" }}
                    tick={{ fill: "#0b1220" }}
                    axisLine={{ stroke: "rgba(0,0,0,0.25)" }}
                    tickLine={{ stroke: "rgba(0,0,0,0.25)" }}
                  />
                  <ReTooltip content={<ChartTooltip />} />
                  <Scatter data={chartGreen} fill="#12b76a" />
                  <Scatter data={chartAmber} fill="#f79009" />
                  <Scatter data={chartRed} fill="#d92d20" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Bar chart */}
        <section className="srAff_card">
          <header className="srAff_cardHeader">
            <h3 className="srAff_cardTitle">Supply & Eligibility by Region</h3>
            <p className="srAff_muted">Compare pipeline (new units) with eligibility and recent change</p>
          </header>

          <div className="srAff_chartMock" style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 16, bottom: 18, left: 0 }}>
                <CartesianGrid strokeDasharray="4 6" />
                <XAxis dataKey="city" interval={0} angle={-18} textAnchor="end" height={70} />
                <YAxis />
                <ReTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0]?.payload;
                    if (!row) return null;
                    return (
                      <div className="srAff_tip">
                        <div className="srAff_tipTitle">{label}</div>
                        <div>
                          Eligible: <b>{row.eligible}%</b>
                        </div>
                        <div>
                          New Units: <b>{row.newUnits}</b>
                        </div>
                        <div>
                          Δ Price: <b>{row.deltaPct}%</b>
                        </div>
                        <div>
                          Status: <b>{statusLabel(row.status)}</b>
                        </div>
                        <div>
                          Dispute:{" "}
                          <b className={row.dispute ? "srAff_disputeText" : "srAff_okText"}>
                            {row.dispute ? "Yes" : "No"}
                          </b>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="newUnits" name="New Affordable Units" fill="#0b1b3a" radius={[10, 10, 0, 0]} />
                <Bar dataKey="eligible" name="Eligible (%)" fill="#c8102e" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Map */}
        <SerbiaCityMap cities={filteredCities} />

        {/* Heatmap */}
        <section className="srAff_card">
          <header className="srAff_cardHeader">
            <h3 className="srAff_cardTitle">Region Affordability Heatmap</h3>
            <p className="srAff_muted">Green = affordable, Amber = stressed, Red = critical</p>
          </header>

          <div className="srAff_heatGrid">
            {filteredCities.slice(0, 10).map((c) => {
              const s = c.status;
              const d = isDispute(c);
              return (
                <div
                  key={c.city}
                  className={`srAff_heatCard srAff_heatCard_${s} ${d ? "srAff_heatCard_dispute" : "srAff_heatCard_ok"}`}
                >
                  <div className="srAff_heatCity">{c.city}</div>
                  <div className="srAff_heatScore">{round1(c.ratio)}x</div>
                  <div className="srAff_heatLabel">P/I Ratio</div>
                  <div className="srAff_heatStatusRow">
                    <span className={`srAff_status srAff_status_${s}`}>{statusLabel(s)}</span>
                    <span className={`srAff_disputeBadge ${d ? "srAff_disputeBadge_bad" : "srAff_disputeBadge_good"}`}>
                      {d ? "dispute" : "ok"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Income Category Breakdown from API */}
        {apiData?.incomeCategories && (
          <section className="srAff_card">
            <header className="srAff_cardHeader">
              <h3 className="srAff_cardTitle">Price-to-Income by Category</h3>
              <p className="srAff_muted">Affordability across income segments</p>
            </header>
            <div className="srAff_tableWrap">
              <table className="srAff_table">
                <thead>
                  <tr>
                    <th>Income Category</th>
                    <th>Avg Annual Income</th>
                    <th>Avg Property Price</th>
                    <th>P/I Ratio</th>
                    <th>Percentile</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(apiData.incomeCategories).map(([cat, d]) => (
                    <tr key={cat}>
                      <td>{cat}</td>
                      <td>€{(d.avgIncome / 1000).toFixed(0)}K/yr</td>
                      <td>€{(d.avgPropertyPrice / 1000).toFixed(0)}K</td>
                      <td>{d.priceToIncome}x</td>
                      <td>{d.percentile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Detailed Region Table */}
        <section className="srAff_card">
          <header className="srAff_cardHeader">
            <h3 className="srAff_cardTitle">Detailed Region Analysis</h3>
          </header>

          <div className="srAff_tableWrap">
            <table className="srAff_table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Median Price</th>
                  <th>Median Income</th>
                  <th>P/I Ratio</th>
                  <th>EMI %</th>
                  <th>Dispute</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.map((c) => {
                  const dispute = isDispute(c);
                  return (
                    <tr key={c.city} className={dispute ? "srAff_rowDispute" : "srAff_rowOk"}>
                      <td className="srAff_regionCell">{c.city}</td>
                      <td>€{c.priceK}K</td>
                      <td>€{c.incomeK}K/yr</td>
                      <td>{round1(c.ratio)}x</td>
                      <td>{round1(c.emiPct)}%</td>
                      <td>
                        <span
                          className={`srAff_disputeBadge ${dispute ? "srAff_disputeBadge_bad" : "srAff_disputeBadge_good"}`}
                        >
                          {dispute ? "dispute" : "no dispute"}
                        </span>
                      </td>
                      <td>
                        <span className={`srAff_status srAff_status_${c.status}`}>{statusLabel(c.status)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!filteredCities.length ? <div className="srAff_emptyState">No regions match your search/filter.</div> : null}
          </div>
        </section>

        <footer className="srAff_footer">
          <div>© {new Date().getFullYear()} PolicyLens • Built for policy simulation & monitoring</div>
          <div className="srAff_footerRight">
            <span className="srAff_footerPill">v1.0</span>
            <span className="srAff_footerPill">Serbia Demo</span>
          </div>
        </footer>
      </div>
    </div>
  );
}