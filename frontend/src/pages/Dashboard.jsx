// dashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

import {
  getDashboardStats,
  getAffordabilityData,
  getBubbleRiskData,
  getSubsidyData,
} from "../utils/api";

/* ====== Illustrations ====== */
function IconHouseCoin() {
  return (
    <svg
      className="kpi-illus"
      viewBox="0 0 240 160"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="y1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd34d" />
          <stop offset="1" stopColor="#ffb300" />
        </linearGradient>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#48d66a" />
          <stop offset="1" stopColor="#1fb64a" />
        </linearGradient>
        <linearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffea8a" />
          <stop offset="1" stopColor="#ffc300" />
        </linearGradient>
      </defs>
      <path
        d="M40 138 C85 112, 130 112, 190 138 L190 150 L40 150 Z"
        fill="#1b7b3a"
        opacity="0.25"
      />
      <path
        d="M44 140 C86 118, 128 118, 186 140 L186 150 L44 150 Z"
        fill="url(#g1)"
        opacity="0.55"
      />
      <path
        d="M62 78 L104 46 L146 78 V132 H62 Z"
        fill="url(#y1)"
        stroke="#ffecb3"
        strokeOpacity="0.6"
      />
      <path
        d="M56 78 L104 36 L152 78 L140 92 L104 62 L68 92 Z"
        fill="#ffbf00"
        opacity="0.95"
      />
      <rect
        x="80"
        y="92"
        width="18"
        height="18"
        rx="2"
        fill="#f6d26a"
        opacity="0.95"
      />
      <rect
        x="104"
        y="92"
        width="18"
        height="18"
        rx="2"
        fill="#f6d26a"
        opacity="0.95"
      />
      <rect
        x="92"
        y="112"
        width="16"
        height="20"
        rx="2"
        fill="#f0c04a"
        opacity="0.95"
      />
      <circle
        cx="170"
        cy="94"
        r="34"
        fill="url(#coin)"
        stroke="#fff2b5"
        strokeOpacity="0.6"
      />
      <circle
        cx="170"
        cy="94"
        r="26"
        fill="none"
        stroke="#d99a00"
        strokeOpacity="0.55"
        strokeWidth="5"
      />
      <text
        x="170"
        y="106"
        textAnchor="middle"
        fontSize="34"
        fontWeight="800"
        fill="#b97c00"
      >
        €
      </text>
    </svg>
  );
}

function IconClipboardGavel() {
  return (
    <svg
      className="kpi-illus"
      viewBox="0 0 240 160"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9ecff" />
        </linearGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6eef8" />
          <stop offset="1" stopColor="#1e88e5" />
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd77a" />
          <stop offset="1" stopColor="#ffb300" />
        </linearGradient>
      </defs>
      <path
        d="M50 140 C95 114, 150 114, 200 140 L200 152 L50 152 Z"
        fill="#1b7b3a"
        opacity="0.22"
      />
      <path
        d="M54 142 C96 122, 148 122, 196 142 L196 152 L54 152 Z"
        fill="#3ad66c"
        opacity="0.35"
      />
      <rect
        x="66"
        y="26"
        width="96"
        height="120"
        rx="10"
        fill="url(#paper)"
        stroke="#ffffff"
        strokeOpacity="0.55"
      />
      <rect x="92" y="18" width="44" height="22" rx="10" fill="url(#metal)" />
      <circle cx="114" cy="28" r="4" fill="#1e88e5" opacity="0.7" />
      <g opacity="0.85" stroke="#1e88e5" strokeWidth="6" strokeLinecap="round">
        <path d="M84 58 L92 66 L108 50" />
        <path d="M84 84 L92 92 L108 76" />
        <path d="M84 110 L92 118 L108 102" />
      </g>
      <g opacity="0.45" stroke="#1e88e5" strokeWidth="6" strokeLinecap="round">
        <path d="M120 58 H146" />
        <path d="M120 84 H146" />
        <path d="M120 110 H146" />
      </g>
      <g transform="translate(150 64) rotate(-18)">
        <rect x="0" y="26" width="86" height="12" rx="6" fill="#1e88e5" opacity="0.9" />
        <rect x="6" y="14" width="44" height="18" rx="5" fill="url(#wood)" />
        <rect x="0" y="10" width="56" height="10" rx="5" fill="#1e88e5" opacity="0.9" />
        <rect x="10" y="34" width="44" height="10" rx="5" fill="#1e88e5" opacity="0.9" />
      </g>
    </svg>
  );
}

function IconMoneyStack() {
  return (
    <svg
      className="kpi-illus"
      viewBox="0 0 240 160"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b6ffdf" />
          <stop offset="1" stopColor="#2ecc71" />
        </linearGradient>
        <linearGradient id="bill2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6df0c1" />
          <stop offset="1" stopColor="#1ea85b" />
        </linearGradient>
        <linearGradient id="coin2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffeaa5" />
          <stop offset="1" stopColor="#ffbf00" />
        </linearGradient>
      </defs>
      <path
        d="M42 140 C86 114, 142 114, 198 140 L198 152 L42 152 Z"
        fill="#1b7b3a"
        opacity="0.22"
      />
      <g transform="translate(56 48)">
        <rect x="0" y="52" width="128" height="44" rx="10" fill="url(#bill2)" opacity="0.95" />
        <rect x="10" y="40" width="128" height="44" rx="10" fill="url(#bill)" opacity="0.95" />
        <rect x="20" y="28" width="128" height="44" rx="10" fill="url(#bill2)" opacity="0.95" />
        <rect x="30" y="16" width="128" height="44" rx="10" fill="url(#bill)" opacity="0.95" />
        <rect x="72" y="18" width="46" height="76" rx="10" fill="#e8f3ff" opacity="0.95" />
        <circle cx="96" cy="56" r="14" fill="#8be7c2" opacity="0.7" />
      </g>
      <g transform="translate(170 110)">
        <ellipse cx="0" cy="22" rx="24" ry="10" fill="#1b7b3a" opacity="0.2" />
        <circle cx="4" cy="10" r="18" fill="url(#coin2)" />
        <circle cx="28" cy="18" r="14" fill="url(#coin2)" opacity="0.95" />
        <circle cx="-18" cy="20" r="12" fill="url(#coin2)" opacity="0.9" />
      </g>
    </svg>
  );
}

function IconChartHouse() {
  return (
    <svg
      className="kpi-illus"
      viewBox="0 0 240 160"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="redHome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6b6b" />
          <stop offset="1" stopColor="#d63434" />
        </linearGradient>
        <linearGradient id="coin3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffeaa5" />
          <stop offset="1" stopColor="#ffbf00" />
        </linearGradient>
      </defs>
      <g opacity="0.18" fill="#d9ecff">
        <rect x="40" y="84" width="14" height="56" rx="4" />
        <rect x="62" y="70" width="14" height="70" rx="4" />
        <rect x="84" y="92" width="14" height="48" rx="4" />
        <rect x="106" y="58" width="14" height="82" rx="4" />
      </g>
      <path
        d="M44 120 L78 92 L104 104 L132 72 L160 82 L190 56"
        fill="none"
        stroke="#dfefff"
        strokeOpacity="0.65"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M190 56 L190 78" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="8" strokeLinecap="round" />
      <path d="M190 56 L206 64" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="8" strokeLinecap="round" />
      <g transform="translate(132 78)">
        <path d="M0 26 L36 0 L72 26 V74 H0 Z" fill="url(#redHome)" stroke="#ffd0d0" strokeOpacity="0.5" />
        <path d="M-4 26 L36 -4 L76 26 L66 38 L36 16 L8 38 Z" fill="#e34848" />
        <rect x="18" y="40" width="16" height="14" rx="2" fill="#ffd2d2" opacity="0.9" />
        <rect x="40" y="40" width="16" height="14" rx="2" fill="#ffd2d2" opacity="0.9" />
        <rect x="30" y="56" width="14" height="18" rx="2" fill="#ffb3b3" opacity="0.9" />
      </g>
      <g transform="translate(188 120)">
        <circle cx="-22" cy="18" r="14" fill="url(#coin3)" opacity="0.95" />
        <circle cx="-2" cy="22" r="16" fill="url(#coin3)" />
        <ellipse cx="-10" cy="38" rx="32" ry="10" fill="#1b7b3a" opacity="0.18" />
      </g>
    </svg>
  );
}

/* ====== UI Pieces ====== */
function Trend({ dir = "up", value, label }) {
  const isUp = dir === "up";
  return (
    <div className="kpi-trend">
      <span className={`trend-chip ${isUp ? "up" : "down"}`}>
        <span className="trend-arrow">{isUp ? "▲" : "▼"}</span>
        {value}
      </span>
      <span className="trend-label">{label}</span>
    </div>
  );
}

function ClickableCard({ to, children }) {
  return (
    <Link to={to} className="kpi-card-link" aria-label="Open details">
      {children}
    </Link>
  );
}

function KpiCard({ to, title, metric, metricSuffix, sub, trend, ctaText, Illus }) {
  return (
    <ClickableCard to={to}>
      <section className="kpi-card" role="article">
        <header className="kpi-head">
          <h3 className="kpi-title">{title}</h3>
        </header>

        <div className="kpi-divider" />

        <div className="kpi-body">
          <div className="kpi-left">
            <div className="kpi-metric">
              <span className="kpi-metric-main">{metric}</span>
              <span className="kpi-metric-suffix">{metricSuffix}</span>
            </div>

            {sub && <div className="kpi-sub">{sub}</div>}
            {trend && <Trend dir={trend.dir} value={trend.value} label={trend.label} />}

            <div className="kpi-actions">
              <span className="kpi-cta">
                {ctaText} <span className="kpi-cta-arrow">▶</span>
              </span>
            </div>
          </div>

          <div className="kpi-right">
            <Illus />
          </div>
        </div>
      </section>
    </ClickableCard>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    affordability: { score: 62, trend: -3.2, level: "Moderate" },
    legalCleanliness: { score: 78.4, disputes: 1217, litigations: 156, trend: 5.8 },
    subsidy: { utilized: 76.2, allocated: 98.5, utilizationRate: 71.6, leakage: true },
    bubbleRisk: { score: 68, trend: 7.2, riskLevel: "Moderate Risk", trendDir: "increasing" },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [affordability, dashboard, subsidy, bubble] = await Promise.all([
          getAffordabilityData(),
          getDashboardStats(),
          getSubsidyData(),
          getBubbleRiskData(),
        ]);

        setStats({
          affordability: {
            score: affordability.data.overallScore,
            trend: affordability.data.trend,
            level: affordability.data.interpretation?.level ?? "Unaffordable",
          },
          legalCleanliness: {
            score: dashboard.data.parcels.verificationRate,
            disputes: dashboard.data.disputes.total,
            litigations: dashboard.data.disputes.inCourt,
            trend: 5.8,
          },
          subsidy: {
            utilized: subsidy.data.totalDisbursed / 1_000_000,
            allocated: subsidy.data.totalAllocated / 1_000_000,
            utilizationRate: subsidy.data.utilizationRate,
            leakage: subsidy.data.fraudulentCases > 0,
          },
          bubbleRisk: {
            score: bubble.data.riskScore,
            trend: bubble.data.currentPriceGrowth,
            riskLevel: bubble.data.interpretation?.riskLevel ?? "Low Risk",
            trendDir: bubble.data.trend, // "increasing" | "decreasing"
          },
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ── helpers: dynamic sub text ──────────────────────────────
  const affordSub = (() => {
    const s = stats.affordability.score;
    if (s >= 70) return "Affordable Price-to-Income Ratio";
    if (s >= 50) return "Moderate Price-to-Income Ratio";
    return "High Price-to-Income Ratio";
  })();

  const bubbleSub = stats.bubbleRisk.riskLevel;
  const bubbleTrendDir = stats.bubbleRisk.trendDir === "increasing" ? "up" : "down";

  // ── LOADING STATE ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-shell">
        <Header />
        <Navbar />
        <main className="dash">
          <div className="dash-loading">
            <div className="dash-spinner" />
            Loading dashboard data...
          </div>
        </main>
      </div>
    );
  }

  // ── ERROR STATE ────────────────────────────────────────────
  if (error) {
    return (
      <div className="dash-shell">
        <Header />
        <Navbar />
        <main className="dash">
          <div className="dash-error">
            <strong>Error loading dashboard:</strong> {error}
            <br />
            <button onClick={() => window.location.reload()} className="dash-retry">
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-shell">
      <Header />
      <Navbar />

      <main className="dash">
        <div className="dash-grid">
          {/* AFFORDABILITY SCORE */}
          <KpiCard
            to="/affordability"
            title="Affordability Score"
            // ✅ only changed display from 100/34 -> 34/100 (frontend-only)
            metric={34}
            metricSuffix="/100"
            sub={affordSub}
            trend={{
              dir: stats.affordability.trend < 0 ? "down" : "up",
              value: `${Math.abs(stats.affordability.trend).toFixed(1)}%`,
              label: "vs Last Quarter",
            }}
            ctaText="Open"
            Illus={IconHouseCoin}
          />

          {/* LEGAL CLEANLINESS */}
          <KpiCard
            to="/Legal-Cleanliness"
            title="Legal Compliance"
            metric={stats.legalCleanliness.score.toFixed(1)}
            metricSuffix="%"
            sub={`${stats.legalCleanliness.disputes.toLocaleString()} Disputes | ${stats.legalCleanliness.litigations} Litigations`}
            trend={{
              dir: "up",
              value: `${stats.legalCleanliness.trend}%`,
              label: "Improvement",
            }}
            ctaText="Open"
            Illus={IconClipboardGavel}
          />

          {/* SUBSIDY EFFECTIVENESS */}
          <KpiCard
            to="/subsidy"
            title="Subsidy Effectiveness"
            metric={stats.subsidy.utilizationRate.toFixed(1)}
            metricSuffix="%"
            sub={`€${stats.subsidy.utilized.toFixed(1)}M of €${stats.subsidy.allocated.toFixed(1)}M Utilized`}
            trend={{
              dir: "up",
              value: "✔",
              label: stats.subsidy.leakage ? "Leakages" : "No Leakage",
            }}
            ctaText="Open"
            Illus={IconMoneyStack}
          />

          {/* PROTECTION AGAINST BUBBLE */}
          <KpiCard
            to="/bubble-risk"
            title="Protection Against Bubble"
            metric={stats.bubbleRisk.score}
            metricSuffix="/100"
            sub={bubbleSub}
            trend={{
              dir: bubbleTrendDir,
              value: `${Math.abs(stats.bubbleRisk.trend).toFixed(1)}%`,
              label: "Increase",
            }}
            ctaText="Open"
            Illus={IconChartHouse}
          />
        </div>
      </main>

      <footer className="dash-footer">
        <div className="footer-inner">
          <span className="footer-brand">Serbia Digital Land Registry</span>
          <span className="footer-sep">•</span>
          <span className="footer-text">© {new Date().getFullYear()} Dashboard Overview</span>
        </div>
      </footer>
    </div>
  );
}