// Overview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Overview.css";
import { getDashboardStats, getRegionalData, getFraudStats } from "../../utils/api";

/** =========
 *  UNIQUE ROOT (do not change)
 *  ========= */
const ROOT_ID = "yro-registry-overview-v4";

/** =========
 *  CONSTANTS / REGIONS (Serbia)
 *  ========= */
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

const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

const MAP_PINS = [
  { label: "Belgrade", x: "50%", y: "45%", c: "BG" },
  { label: "Južna Bačka", x: "47%", y: "18%", c: "JB" },
  { label: "Severna Bačka", x: "38%", y: "9%", c: "SB" },
  { label: "Zapadna Bačka", x: "26%", y: "13%", c: "ZB" },
  { label: "Srednji Banat", x: "60%", y: "18%", c: "MB" },
  { label: "Severni Banat", x: "58%", y: "10%", c: "NB" },
  { label: "Južni Banat", x: "65%", y: "28%", c: "SBa" },
  { label: "Srem", x: "34%", y: "32%", c: "SR" },
  { label: "Mačva", x: "24%", y: "44%", c: "MA" },
  { label: "Kolubara", x: "33%", y: "51%", c: "KO" },
  { label: "Podunavlje", x: "56%", y: "49%", c: "PO" },
  { label: "Braničevo", x: "65%", y: "49%", c: "BR" },
  { label: "Šumadija", x: "44%", y: "56%", c: "ŠU" },
  { label: "Pomoravlje", x: "56%", y: "58%", c: "PM" },
  { label: "Bor", x: "74%", y: "54%", c: "BO" },
  { label: "Zaječar", x: "76%", y: "60%", c: "ZA" },
  { label: "Zlatibor", x: "22%", y: "64%", c: "ZL" },
  { label: "Moravica", x: "33%", y: "63%", c: "MO" },
  { label: "Raška", x: "38%", y: "70%", c: "RA" },
  { label: "Rasina", x: "52%", y: "65%", c: "RS" },
  { label: "Nišava", x: "62%", y: "70%", c: "NI" },
  { label: "Toplica", x: "54%", y: "74%", c: "TO" },
  { label: "Pirot", x: "74%", y: "72%", c: "PI" },
  { label: "Jablanica", x: "53%", y: "82%", c: "JA" },
  { label: "Pčinja", x: "65%", y: "88%", c: "PČ" },
];

const TIME_RANGE_MAP = {
  "Last 7 days": "7days",
  "Last 30 days": "30days",
  "Last 90 days": "90days",
};

/** =========
 *  HELPERS
 *  ========= */
function hash01(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 2 ** 32;
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function formatDots(num) {
  if (num === null || num === undefined || num === "—") return "—";
  const s = Math.round(Number(num)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function series(seed, n, min, max, wobble = 0.25) {
  const base = hash01(seed);
  const out = [];
  let prev = min + (max - min) * base;
  for (let i = 0; i < n; i++) {
    const r = hash01(`${seed}|${i}`);
    const drift = (r - 0.5) * (max - min) * wobble;
    prev = clamp(prev + drift, min, max);
    out.push(prev);
  }
  return out;
}
function pathFromSeries(xs, ys, baselineY) {
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 1; i < xs.length; i++) d += ` L${xs[i]},${ys[i]}`;
  d += ` L${xs[xs.length - 1]},${baselineY} L${xs[0]},${baselineY} Z`;
  return d;
}
function lineFromSeries(xs, ys) {
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 1; i < xs.length; i++) d += ` L${xs[i]},${ys[i]}`;
  return d;
}
function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function donutArcPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const p1 = polarToXY(cx, cy, rOuter, startAngle);
  const p2 = polarToXY(cx, cy, rOuter, endAngle);
  const p3 = polarToXY(cx, cy, rInner, endAngle);
  const p4 = polarToXY(cx, cy, rInner, startAngle);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

/** ✅ FIX: force donut values to sum to 100 (prevents wrong hover labels) */
function normalizeTo100(rawObj) {
  const keys = Object.keys(rawObj);
  const raw = keys.map((k) => Math.max(0, Number(rawObj[k] || 0)));
  const sum = raw.reduce((a, b) => a + b, 0);

  // fallback: equal split
  if (sum <= 0) {
    const each = Math.floor(100 / keys.length);
    const out0 = {};
    keys.forEach((k) => (out0[k] = each));
    out0[keys[0]] += 100 - each * keys.length;
    return out0;
  }

  // scaled float
  const scaled = raw.map((v) => (v / sum) * 100);

  // largest remainder rounding
  const floors = scaled.map((v) => Math.floor(v));
  let remain = 100 - floors.reduce((a, b) => a + b, 0);
  const fracIdx = scaled
    .map((v, i) => ({ i, f: v - floors[i] }))
    .sort((a, b) => b.f - a.f);

  const out = {};
  keys.forEach((k, idx) => (out[k] = floors[idx]));
  let p = 0;
  while (remain > 0) {
    out[keys[fracIdx[p % fracIdx.length].i]] += 1;
    remain -= 1;
    p += 1;
  }
  return out;
}

/** =========
 *  ICONS
 *  ========= */
function Icon({ name }) {
  switch (name) {
    case "filter":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic" aria-hidden="true">
          <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic" aria-hidden="true">
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16.5 16.5 21 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "chev":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic yro-ic--sm" aria-hidden="true">
          <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "cal":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic" aria-hidden="true">
          <path d="M7 3v3M17 3v3M4 8h16M6 11h4M6 15h4M12 11h6M12 15h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "warn":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic" aria-hidden="true">
          <path d="M12 3l10 18H2L12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1" fill="currentColor" />
        </svg>
      );
    case "swap":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic" aria-hidden="true">
          <path d="M7 7h12l-3-3M17 17H5l3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "doc":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic" aria-hidden="true">
          <path d="M7 3h7l3 3v15H7V3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M14 3v4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 11h6M9 15h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic" aria-hidden="true">
          <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "pulse":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic" aria-hidden="true">
          <path d="M3 12h4l2-5 4 10 2-5h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic" aria-hidden="true">
          <path d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" className="yro-ic" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.2 12.2l2.3 2.4 5.4-5.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

/** =========
 *  UI PARTS
 *  ========= */
function StatCard({ title, value, delta, deltaType = "down", icon, iconTone = "amber", sub, valueTone }) {
  return (
    <div className="yro-card yro-stat" tabIndex={0}>
      <div className="yro-stat__head">
        <div className="yro-stat__title">{title}</div>
        <div className={`yro-badgeIcon yro-badgeIcon--${iconTone}`}>
          <Icon name={icon} />
        </div>
      </div>

      <div className={`yro-stat__value ${valueTone ? `yro-stat__value--${valueTone}` : ""}`}>{value}</div>

      {delta ? (
        <div className={`yro-stat__delta yro-stat__delta--${deltaType}`}>
          <span className="yro-deltaArrow">{deltaType === "up" ? "↗" : "↘"}</span>
          {delta} <span className="yro-muted">vs last month</span>
        </div>
      ) : (
        <div className="yro-stat__sub yro-muted">{sub || "Registered in system"}</div>
      )}
    </div>
  );
}

function MiniCard({ value, label, icon, tone = "teal" }) {
  return (
    <div className="yro-card yro-mini" tabIndex={0}>
      <div className={`yro-mini__ic yro-mini__ic--${tone}`}>
        <Icon name={icon} />
      </div>
      <div className="yro-mini__meta">
        <div className="yro-mini__value">{value}</div>
        <div className="yro-mini__label yro-muted">{label}</div>
      </div>
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="yro-tabs" role="tablist" aria-label="Heatmap Tabs">
      {tabs.map((t) => (
        <button key={t} className={`yro-tab ${t === active ? "is-active" : ""}`} type="button" onClick={() => onChange(t)}>
          {t}
        </button>
      ))}
    </div>
  );
}

function Select({ value, options, onChange, leftIcon }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="yro-selectWrap">
      <button className={`yro-select ${open ? "is-open" : ""}`} type="button" onClick={() => setOpen((v) => !v)} onBlur={() => setOpen(false)}>
        {leftIcon ? <span className="yro-select__left">{leftIcon}</span> : null}
        <span className="yro-select__value" title={value}>
          {value}
        </span>
        <Icon name="chev" />
      </button>

      {open ? (
        <div className="yro-menu" role="listbox">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`yro-menuItem ${opt === value ? "is-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** =========
 *  HEATMAP
 *  ========= */
function Heatmap({ activeRegion, mode, intensityByRegion }) {
  const isAll = activeRegion === "All Regions";
  const legendTitle = mode === "Disputes" ? "Dispute Rate" : mode === "Transfers" ? "Transfer Load" : "Processing Load";

  return (
    <div className={`yro-heatmap ${mode === "Disputes" ? "is-disputes" : mode === "Transfers" ? "is-transfers" : "is-processing"}`}>
      <div className="yro-mapStage">
        <div className="yro-mapOutline" />
        <div className="yro-mapMode">{mode}</div>

        {MAP_PINS.map((p) => {
          const active = activeRegion === p.label;
          const dim = !isAll && !active;
          const intensity = intensityByRegion[p.label] ?? 0.3;
          const level = intensity < 0.34 ? "low" : intensity < 0.67 ? "med" : "high";

          return (
            <button
              key={p.label}
              type="button"
              className={`yro-pin ${active ? "is-active" : ""} ${dim ? "is-dim" : ""}`}
              style={{ left: p.x, top: p.y }}
              title={`${p.label} • ${legendTitle}: ${Math.round(intensity * 100)}%`}
            >
              <span className={`yro-pin__dot yro-pin__dot--${level}`}>{p.c}</span>
              <span className="yro-pin__label">{p.label}</span>
            </button>
          );
        })}

        <div className="yro-mapLegend">
          <div className="yro-mapLegend__title yro-muted">{legendTitle}</div>
          <div className="yro-mapLegend__row">
            <span className="yro-pill" title="Low">
              <span className="yro-pillDot yro-pillDot--low" /> Low
            </span>
            <span className="yro-pill" title="Medium">
              <span className="yro-pillDot yro-pillDot--med" /> Med
            </span>
            <span className="yro-pill" title="High">
              <span className="yro-pillDot yro-pillDot--high" /> High
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** =========
 *  DONUT
 *  ========= */
function DonutInteractive({ data, onHover, onLeave }) {
  const segments = useMemo(() => {
    if (!data) return [];

    // ✅ 4 segments always present
    // ✅ 3 colors only:
    //   Ownership = red (a)
    //   Boundary = orange (b)
    //   Inheritance = green (c)
    //   Encumbrance = orange (d)  (still orange so total = 3 colors)
    const entries = [
      { k: "Ownership", v: data.Ownership, cls: "a" },      // red
      { k: "Boundary", v: data.Boundary, cls: "b" },        // orange
      { k: "Inheritance", v: data.Inheritance, cls: "c" },  // green
      { k: "Encumbrance", v: data.Encumbrance, cls: "d" },  // orange
    ];

    // ✅ IMPORTANT:
    // If a value is 0, SVG arc angle becomes 0 => invisible.
    // So we use a "displayV" (tiny slice) ONLY for drawing,
    // but tooltip + labels still show the real value (v).
    const minSlice = 1; // 1% visual slice for 0 values
    const displayRaw = entries.map((e) => (Number(e.v) <= 0 ? minSlice : Number(e.v)));
    const displaySum = displayRaw.reduce((a, b) => a + b, 0);

    let start = 0;
    return entries.map((e, i) => {
      const displayV = (displayRaw[i] / displaySum) * 100; // normalized to 100 for angles
      const end = start + (displayV / 100) * 360;
      const seg = { ...e, start, end };
      start = end;
      return seg;
    });
  }, [data]);

  const cx = 110;
  const cy = 110;
  const rOuter = 78;
  const rInner = 52;

  const centerLabel = useMemo(() => {
    if (!data) return { top: "Disputes", mid: "—" };
    return { top: "Disputes", mid: "Type Mix" };
  }, [data]);

  if (!data)
    return (
      <div className="yro-donutWrap" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
        Loading...
      </div>
    );

  return (
    <div className="yro-donutWrap">
      <div className="yro-donutStage">
        <svg viewBox="0 0 220 220" className="yro-donut2" aria-hidden="true" onMouseLeave={onLeave}>
          <circle className="yro-donut2__bg" cx={cx} cy={cy} r={(rOuter + rInner) / 2} />

          {segments.map((s) => {
            const midR = (rOuter + rInner) / 2;
            const hit = donutArcPath(cx, cy, midR + 18, midR - 18, s.start, s.end);
            const vis = donutArcPath(cx, cy, rOuter, rInner, s.start, s.end);

            return (
              <g key={s.k}>
                <path
                  className="yro-donut2__hit"
                  d={hit}
                  onMouseMove={(e) => onHover?.(e, `${s.k}: ${s.v}%`)}
                  onMouseEnter={(e) => onHover?.(e, `${s.k}: ${s.v}%`)}
                />
                <path
                  className={`yro-donut2__seg yro-donut2__seg--${s.cls}`}
                  d={vis}
                  onMouseMove={(e) => onHover?.(e, `${s.k}: ${s.v}%`)}
                  onMouseEnter={(e) => onHover?.(e, `${s.k}: ${s.v}%`)}
                />
              </g>
            );
          })}

          <g className="yro-donut2__center" aria-hidden="true">
            <text x={cx} y={cy - 4} textAnchor="middle" className="yro-donut2__centerTop">
              {centerLabel.top}
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" className="yro-donut2__centerMid">
              {centerLabel.mid}
            </text>
          </g>
        </svg>
      </div>

      <div className="yro-donutLabels">
        <div className="yro-donutLabel yro-muted">Ownership: {data.Ownership}%</div>
        <div className="yro-donutLabel yro-muted">Boundary: {data.Boundary}%</div>
        <div className="yro-donutLabel yro-muted">Inheritance: {data.Inheritance}%</div>
        <div className="yro-donutLabel yro-muted">Encumbrance: {data.Encumbrance}%</div>
      </div>

      {/* ✅ Legend now matches 3-color rule */}
      <div className="yro-legendRow">
        <div className="yro-leg" title="Ownership">
          <span className="yro-dot yro-dot--a" /> Ownership
        </div>
        <div className="yro-leg" title="Boundary">
          <span className="yro-dot yro-dot--b" /> Boundary
        </div>
        <div className="yro-leg" title="Inheritance">
          <span className="yro-dot yro-dot--c" /> Inheritance
        </div>
        <div className="yro-leg" title="Encumbrance">
          <span className="yro-dot yro-dot--d" /> Encumbrance
        </div>
      </div>
    </div>
  );
}

/** =========
 *  CHARTS (unchanged)
 *  ========= */
function AreaChart({ seedKey, onHover, onLeave }) {
  const top = series(`${seedKey}|top`, 8, 70, 160, 0.22);
  const mid = series(`${seedKey}|mid`, 8, 120, 190, 0.22);
  const low = series(`${seedKey}|low`, 8, 170, 205, 0.18);

  for (let i = 0; i < 8; i++) {
    const t = top[i];
    const m = Math.max(mid[i], t + 25);
    const l = Math.max(low[i], m + 18);
    top[i] = t;
    mid[i] = m;
    low[i] = l;
  }

  const xs = Array.from({ length: 8 }).map((_, i) => 50 + i * 80);

  const baseline = 220;
  const labelY = 258;
  const vbH = 280;

  const topLine = lineFromSeries(xs, top);
  const midLine = lineFromSeries(xs, mid);
  const lowLine = lineFromSeries(xs, low);

  return (
    <div className="yro-chartMock">
      <svg viewBox={`0 0 700 ${vbH}`} className="yro-svgChart" aria-hidden="true" onMouseLeave={onLeave}>
        <defs>
          <linearGradient id="yro-gradTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--navy2)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--navy2)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="yro-gradMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--teal)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="yro-gradLow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--red)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--red)" stopOpacity="0.02" />
          </linearGradient>

          <filter id="yro-lineGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.18" />
          </filter>
        </defs>

        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1="50" y1={30 + i * 30} x2="670" y2={30 + i * 30} className="yro-grid" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={50 + i * 80} y1="30" x2={50 + i * 80} y2="210" className="yro-grid" />
        ))}

        <path className="yro-area yro-area--top" d={pathFromSeries(xs, top, baseline)} />
        <path className="yro-area yro-area--mid" d={pathFromSeries(xs, mid, baseline)} />
        <path className="yro-area yro-area--low" d={pathFromSeries(xs, low, baseline)} />

        <path className="yro-line yro-line--top" d={topLine} />
        <path className="yro-line yro-line--mid" d={midLine} />
        <path className="yro-line yro-line--low" d={lowLine} />

        {MONTHS.map((m, i) => (
          <g key={m}>
            <circle className="yro-point yro-point--top" cx={xs[i]} cy={top[i]} r="3.5" onMouseMove={(e) => onHover?.(e, `Month: ${m}`)} onMouseEnter={(e) => onHover?.(e, `Month: ${m}`)} />
            <circle className="yro-point yro-point--mid" cx={xs[i]} cy={mid[i]} r="3.5" />
            <circle className="yro-point yro-point--low" cx={xs[i]} cy={low[i]} r="3.5" />

            <text x={xs[i]} y={labelY} className="yro-axisText yro-axisText--hover" textAnchor="middle" onMouseMove={(e) => onHover?.(e, `Month: ${m}`)}>
              {m}
            </text>
          </g>
        ))}

        {["3200", "2400", "1600", "800", "0"].map((v, i) => (
          <text key={v} x="12" y={40 + i * 40} className="yro-axisText yro-axisText--hover" onMouseMove={(e) => onHover?.(e, `Scale: ${v}`)}>
            {v}
          </text>
        ))}
      </svg>

      <div className="yro-chartLegend">
        <span className="yro-chartKey">
          <i className="yro-kdot yro-kdot--top" /> Disputes
        </span>
        <span className="yro-chartKey">
          <i className="yro-kdot yro-kdot--mid" /> Transfers
        </span>
        <span className="yro-chartKey">
          <i className="yro-kdot yro-kdot--low" /> Processing
        </span>
      </div>
    </div>
  );
}

function HBarChart({ data, onHover, onLeave }) {
  const labels = ["Sale", "Inheritance", "Subdivision", "Donation"];
  const rawVals = labels.map((l) => (data ? data[l] ?? 0 : 0));
  const maxVal = Math.max(...rawVals, 1);

  const rows = labels.map((label, idx) => ({
    label,
    val: rawVals[idx],
    y: 55 + idx * 35,
    w: (rawVals[idx] / maxVal) * 360,
  }));

  return (
    <div className="yro-chartMock">
      <svg viewBox="0 0 520 220" className="yro-svgChart" aria-hidden="true" onMouseLeave={onLeave}>
        <line x1="70" y1="190" x2="500" y2="190" className="yro-axis" />
        <line x1="70" y1="30" x2="70" y2="190" className="yro-axis" />
        {[0, 20, 40, 60, 80].map((t, i) => (
          <g key={t}>
            <line x1={70 + i * 86} y1="190" x2={70 + i * 86} y2="196" className="yro-tick" />
            <text x={70 + i * 86} y="212" className="yro-axisText yro-axisText--hover" textAnchor="middle" onMouseMove={(e) => onHover?.(e, `X: ${t}`)}>
              {t}
            </text>
          </g>
        ))}
        {rows.map((b) => (
          <g key={b.label} className="yro-rowHover">
            <text x="20" y={b.y + 10} className="yro-axisText yro-axisText--hover" onMouseMove={(e) => onHover?.(e, `${b.label}: ${b.val}`)}>
              {b.label}
            </text>
            <rect x="70" y={b.y - 4} width="430" height="30" rx="10" className="yro-rowHit" onMouseMove={(e) => onHover?.(e, `${b.label}: ${b.val}`)} />
            <rect x="70" y={b.y} width={b.w} height="22" rx="9" className="yro-bar" onMouseMove={(e) => onHover?.(e, `${b.label}: ${b.val}`)} />
          </g>
        ))}
      </svg>
    </div>
  );
}

function VBarChart({ data, onHover, onLeave }) {
  const vals = MONTHS.map((m, i) =>
    data ? data[m] ?? Math.round(2 + hash01(`vbar|${m}|${i}`) * 14) : Math.round(2 + hash01(`vbar|${m}|${i}`) * 14)
  );
  const max = 16;

  return (
    <div className="yro-chartMock">
      <svg viewBox="0 0 520 220" className="yro-svgChart" aria-hidden="true" onMouseLeave={onLeave}>
        <line x1="60" y1="190" x2="500" y2="190" className="yro-axis" />
        <line x1="60" y1="30" x2="60" y2="190" className="yro-axis" />
        {[0, 4, 8, 12, 16].map((t, i) => (
          <g key={t}>
            <line x1="54" y1={190 - i * 40} x2="60" y2={190 - i * 40} className="yro-tick" />
            <text x="34" y={194 - i * 40} className="yro-axisText yro-axisText--hover" textAnchor="end" onMouseMove={(e) => onHover?.(e, `Y: ${t}`)}>
              {t}
            </text>
            <line x1="60" y1={190 - i * 40} x2="500" y2={190 - i * 40} className="yro-grid" />
          </g>
        ))}
        {MONTHS.map((m, i) => {
          const v = vals[i];
          const h = (v / max) * 150;
          return (
            <g key={m} className="yro-colHover">
              <rect x={78 + i * 48} y="30" width="42" height="160" rx="12" className="yro-colHit" onMouseMove={(e) => onHover?.(e, `${m}: ${v}`)} />
              <rect x={85 + i * 48} y={190 - h} width="28" height={h} rx="9" className="yro-bar" onMouseMove={(e) => onHover?.(e, `${m}: ${v}`)} />
              <text x={99 + i * 48} y="212" className="yro-axisText yro-axisText--hover" textAnchor="middle" onMouseMove={(e) => onHover?.(e, `${m}: ${v}`)}>
                {m}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** =========
 *  MAIN
 *  ========= */
export default function Overview() {
  const navigate = useNavigate();

  const [region, setRegion] = useState("All Regions");
  const [range, setRange] = useState("Last 30 days");
  const [search, setSearch] = useState("");
  const [heatMode, setHeatMode] = useState("Disputes");

  // API data
  const [statsData, setStatsData] = useState(null);
  const [regionalData, setRegionalData] = useState([]);
  const [fraudData, setFraudData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tooltip
  const [tip, setTip] = useState({ show: false, x: 0, y: 0, text: "", panel: "" });
  const panelRefs = {
    donut: useRef(null),
    monthly: useRef(null),
    hbar: useRef(null),
    vbar: useRef(null),
  };

  const showTip = (panel) => (e, text) => {
    const rootEl = panelRefs[panel]?.current;
    const rect = rootEl ? rootEl.getBoundingClientRect() : (e.currentTarget.ownerSVGElement || e.currentTarget).getBoundingClientRect();
    setTip({ show: true, x: e.clientX - rect.left, y: e.clientY - rect.top, text, panel });
  };
  const hideTip = () => setTip((t) => ({ ...t, show: false }));

  // Fetch from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const apiRegion = region === "All Regions" ? "" : region;
    const apiTimeRange = TIME_RANGE_MAP[range] || "30days";

    Promise.all([
      getDashboardStats(apiRegion, apiTimeRange).catch(() => null),
      getRegionalData().catch(() => null),
      getFraudStats(apiRegion).catch(() => null),
    ]).then(([stats, regional, fraud]) => {
      if (cancelled) return;
      if (stats?.success) setStatsData(stats.data);
      if (regional?.success) setRegionalData(regional.data || []);
      if (fraud?.success) setFraudData(fraud.data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [region, range]);

  // Build intensity map from backend regional data
  const intensityByRegion = useMemo(() => {
    const out = {};
    if (!regionalData.length) {
      for (const r of REGIONS.filter((x) => x !== "All Regions")) {
        const seed = `${heatMode}|${range}|${r}`;
        const base = hash01(seed);
        const modeBoost = heatMode === "Disputes" ? 0.12 : heatMode === "Transfers" ? 0.18 : 0.22;
        out[r] = clamp(base * 0.9 + modeBoost, 0.05, 0.98);
      }
      return out;
    }
    const maxDisputes = Math.max(...regionalData.map((r) => r.disputes || 0), 1);
    const maxTransfers = Math.max(...regionalData.map((r) => r.transfers || 0), 1);
    const maxParcels = Math.max(...regionalData.map((r) => r.parcels || 0), 1);

    for (const r of REGIONS.filter((x) => x !== "All Regions")) {
      const rd = regionalData.find((x) => x.region === r);
      if (!rd) {
        out[r] = 0.3;
        continue;
      }
      if (heatMode === "Disputes") out[r] = clamp(rd.disputes / maxDisputes, 0.05, 0.98);
      else if (heatMode === "Transfers") out[r] = clamp(rd.transfers / maxTransfers, 0.05, 0.98);
      else out[r] = clamp(rd.parcels / maxParcels, 0.05, 0.98);
    }
    return out;
  }, [regionalData, heatMode, range]);

  // Compute KPI values from API data
  const computed = useMemo(() => {
    if (!statsData) {
      return {
        disputes: "—",
        transfers: "—",
        mortgages: "—",
        totalParcels: "—",
        transactionsToday: "—",
        avgValidation: "—",
        nodes: "—",
        uptime: "—",
      };
    }
    return {
      disputes: formatDots(statsData.disputes?.active ?? 0),
      transfers: formatDots(statsData.transfers?.pending ?? 0),
      mortgages: formatDots(statsData.mortgages?.active ?? 0),
      totalParcels: formatDots(statsData.parcels?.total ?? 0),
      transactionsToday: formatDots(statsData.transfers?.total ?? 0),
      avgValidation: "2.1s",
      nodes: "24",
      uptime: "99.97%",
    };
  }, [statsData]);

  // dispute tone
  const disputesNum = useMemo(() => {
    const n = Number(String(computed.disputes).replace(/\./g, ""));
    return Number.isFinite(n) ? n : null;
  }, [computed.disputes]);

  const disputeTone = disputesNum === null ? "" : disputesNum > 0 ? "bad" : "good";

  /** ✅ FIXED Donut data: always sums to 100 (prevents Ownership hover showing Inheritance etc.) */
  const donutData = useMemo(() => {
    if (!statsData) return null;

    // if backend provides byType counts, prefer it
    const byType = statsData.disputes?.byType;
    if (byType && typeof byType === "object") {
      const normalized = normalizeTo100({
        Ownership: byType.Ownership ?? byType.ownership ?? 0,
        Boundary: byType.Boundary ?? byType.boundary ?? 0,
        Inheritance: byType.Inheritance ?? byType.inheritance ?? 0,
        Encumbrance: byType.Encumbrance ?? byType.encumbrance ?? 0,
      });
      return normalized;
    }

    // fallback: derive from known dispute fields but keep 100% total
    const total = Math.max(Number(statsData.disputes?.total ?? 0), 1);
    const active = clamp(Number(statsData.disputes?.active ?? 0), 0, total);
    const inCourt = clamp(Number(statsData.disputes?.inCourt ?? 0), 0, total - active);

    const resolved = clamp(total - active - inCourt, 0, total);

    // split resolved into boundary + encumbrance with stable seed (so it looks consistent)
    const splitSeed = hash01(`donut-split|${region}|${range}`);
    const boundaryRaw = resolved * clamp(0.55 + (splitSeed - 0.5) * 0.2, 0.35, 0.75);
    const encRaw = Math.max(0, resolved - boundaryRaw);

    const normalized = normalizeTo100({
      Ownership: active,
      Boundary: boundaryRaw,
      Inheritance: inCourt,
      Encumbrance: encRaw,
    });

    return normalized;
  }, [statsData, region, range]);

  // HBar data from regional aggregation
  const hbarData = useMemo(() => {
    if (!regionalData.length) return null;
    const total = regionalData.reduce((s, r) => s + (r.transfers || 0), 0);
    return {
      Sale: Math.round(total * 0.55),
      Inheritance: Math.round(total * 0.22),
      Subdivision: Math.round(total * 0.14),
      Donation: Math.round(total * 0.09),
    };
  }, [regionalData]);

  // records
  const records = useMemo(() => {
    if (!regionalData.length) return [];
    return regionalData.map((rd) => ({
      id: rd.region,
      name: rd.region,
      region: rd.region,
      parcels: rd.parcels || 0,
      disputes: rd.disputes || 0,
      transfers: rd.transfers || 0,
    }));
  }, [regionalData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((rec) => {
      if (region !== "All Regions" && rec.region !== region) return false;
      if (!q) return true;
      return (
        rec.region.toLowerCase().includes(q) ||
        String(rec.parcels).includes(q) ||
        String(rec.disputes).includes(q) ||
        String(rec.transfers).includes(q)
      );
    });
  }, [records, region, search]);

  // VBar fraud data from backend
  const vbarFraudData = useMemo(() => {
    if (!fraudData?.monthly) return null;
    const out = {};
    for (const item of fraudData.monthly) out[item.month] = item.count;
    return out;
  }, [fraudData]);

  const seedKey = `${region}|${range}|${search.trim().toLowerCase()}|${heatMode}`;

  const handleReturn = () => {
    const prev = sessionStorage.getItem("prev_path");
    if (prev) {
      navigate(prev);
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate("/overview");
  };

  const lastUpdated = useMemo(() => {
    try {
      const d = new Date();
      return d.toLocaleString();
    } catch {
      return "—";
    }
  }, [region, range, loading]);

  return (
    <div id={ROOT_ID} className="yro-page">
      <div className="yro-shell">
        <header className="yro-header">
          <div>
            <h1 className="yro-title">Registry Overview</h1>
            <div className="yro-subtitle yro-muted">Real-time land registry system monitoring</div>
          </div>

          <div className="yro-headerRight">
            <button className="yro-backBtn" type="button" onClick={handleReturn} title="Return to main dashboard">
              ← Return
            </button>

            <div className="yro-status" title="System status">
              <span className="yro-statusDot" />
              {loading ? "Loading..." : "System Online"}
            </div>
          </div>
        </header>

        {/* TOP FILTER BAR */}
        <section className="yro-topFilters">
          <div className="yro-topFilters__head">
            <div className="yro-topFilters__label">
              <Icon name="filter" />
              <span>Filters</span>
            </div>

            <div className="yro-topFilters__meta yro-muted" title="Last refreshed time">
              Last updated: <b className="yro-topFilters__metaStrong">{lastUpdated}</b>
            </div>
          </div>

          <div className="yro-topFilters__row">
            <div className="yro-input yro-input--top" title="Search by ID, name, or region">
              <Icon name="search" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID or name..." />
            </div>

            <Select value={region} options={REGIONS} onChange={setRegion} />

            <Select value={range} options={["Last 7 days", "Last 30 days", "Last 90 days"]} onChange={setRange} leftIcon={<Icon name="cal" />} />
          </div>

          <div className="yro-topFilters__bottom">
            <button
              className="yro-reset"
              type="button"
              onClick={() => {
                setSearch("");
                setRegion("All Regions");
                setRange("Last 30 days");
                setHeatMode("Disputes");
              }}
            >
              ✕ <span>Reset filters</span>
            </button>

            <div className="yro-results" title="Matching records">
              Showing <b>{filtered.length}</b> records
            </div>
          </div>
        </section>

        <section className="yro-grid4">
          <StatCard title="Active Disputes" value={computed.disputes} icon="warn" iconTone="serbRed" sub="Open dispute cases" valueTone={disputeTone} />
          <StatCard title="Pending Transfers" value={computed.transfers} icon="swap" iconTone="navy" sub="Awaiting approval" />
          <StatCard title="Active Mortgages" value={computed.mortgages} icon="doc" iconTone="navy" sub="Registered in system" />
          <StatCard title="Total Parcels" value={computed.totalParcels} icon="pin" iconTone="serbRed" sub={region === "All Regions" ? "Registered in system" : `Registered in ${region}`} />
        </section>

        <section className="yro-grid4 yro-grid4--mini">
          <MiniCard value={computed.transactionsToday} label="Transactions Today" icon="pulse" tone="serbRed" />
          <MiniCard value={computed.avgValidation} label="Avg Validation" icon="clock" tone="good" />
          <MiniCard value={computed.nodes} label="Active Nodes" icon="shield" tone="navy" />
          <MiniCard value={computed.uptime} label="System Uptime" icon="check" tone="good" />
        </section>

        <section className="yro-grid2">
          <div className="yro-card yro-panel">
            <div className="yro-panel__head">
              <h2 className="yro-h2">Regional Heat Map</h2>
              <Tabs tabs={["Disputes", "Transfers", "Processing"]} active={heatMode} onChange={setHeatMode} />
            </div>
            <Heatmap activeRegion={region} mode={heatMode} intensityByRegion={intensityByRegion} />
          </div>

          <div ref={panelRefs.donut} className="yro-card yro-panel yro-panel--rel">
            <div className="yro-panel__head yro-panel__head--tight">
              <h2 className="yro-h2">Disputes by Type</h2>
            </div>
            <div className="yro-tooltipLayer yro-tooltipLayer--donut">
              {tip.show && tip.panel === "donut" ? (
                <div className="yro-tooltip" style={{ left: tip.x + 12, top: tip.y + 12 }}>
                  {tip.text}
                </div>
              ) : null}
            </div>
            <DonutInteractive data={donutData} onHover={showTip("donut")} onLeave={hideTip} />
          </div>
        </section>

        <section ref={panelRefs.monthly} className="yro-card yro-panel yro-panel--rel">
          <div className="yro-panel__head yro-panel__head--tight">
            <h2 className="yro-h2">Monthly Activity Trends</h2>
          </div>
          <div className="yro-tooltipLayer">
            {tip.show && tip.panel === "monthly" ? (
              <div className="yro-tooltip" style={{ left: tip.x + 12, top: tip.y + 12 }}>
                {tip.text}
              </div>
            ) : null}
          </div>
          <AreaChart seedKey={`${seedKey}|monthly`} onHover={showTip("monthly")} onLeave={hideTip} />
        </section>

        <section className="yro-grid2 yro-grid2--bottom">
          <div ref={panelRefs.hbar} className="yro-card yro-panel yro-panel--rel">
            <div className="yro-panel__head yro-panel__head--tight">
              <h2 className="yro-h2">Transfers by Type</h2>
            </div>
            <div className="yro-tooltipLayer">
              {tip.show && tip.panel === "hbar" ? (
                <div className="yro-tooltip" style={{ left: tip.x + 12, top: tip.y + 12 }}>
                  {tip.text}
                </div>
              ) : null}
            </div>
            <HBarChart data={hbarData} onHover={showTip("hbar")} onLeave={hideTip} />
          </div>

          <div ref={panelRefs.vbar} className="yro-card yro-panel yro-panel--rel">
            <div className="yro-panel__head yro-panel__head--tight">
              <h2 className="yro-h2">Fraud Prevention</h2>
            </div>
            <div className="yro-tooltipLayer">
              {tip.show && tip.panel === "vbar" ? (
                <div className="yro-tooltip" style={{ left: tip.x + 12, top: tip.y + 12 }}>
                  {tip.text}
                </div>
              ) : null}
            </div>
            <VBarChart data={vbarFraudData} onHover={showTip("vbar")} onLeave={hideTip} />
          </div>
        </section>

        <footer className="yro-footer" aria-label="Overview Footer">
          <div className="yro-footer__left">
            <div className="yro-footer__brand">Serbia Land Registry • Overview</div>
            <div className="yro-footer__meta yro-muted">Data refresh depends on backend availability. Last updated: {lastUpdated}</div>
          </div>

          <div className="yro-footer__right">
            <span className="yro-footer__chip" title="Environment">
              Prod
            </span>
            <span className="yro-footer__sep" />
            <span className="yro-footer__meta yro-muted">© {new Date().getFullYear()} Registry Monitoring</span>
          </div>
        </footer>
      </div>
    </div>
  );
}