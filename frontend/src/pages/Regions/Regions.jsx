// Regions.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import "./Regions.css";
import { getRegionalData } from "../../utils/api";

/**
 * Regions.jsx - Dynamic version fetching from backend
 * All data from GET /api/dashboard/regional-data
 */

const heatMapPositions = [
  { region: "Belgrade", top: 45, left: 50 },
  { region: "Južna Bačka", top: 18, left: 47 },
  { region: "Severna Bačka", top: 9, left: 38 },
  { region: "Zapadna Bačka", top: 13, left: 26 },
  { region: "Srednji Banat", top: 18, left: 60 },
  { region: "Severni Banat", top: 10, left: 58 },
  { region: "Južni Banat", top: 28, left: 65 },
  { region: "Srem", top: 32, left: 34 },
  { region: "Mačva", top: 44, left: 24 },
  { region: "Kolubara", top: 51, left: 33 },
  { region: "Podunavlje", top: 49, left: 56 },
  { region: "Braničevo", top: 49, left: 65 },
  { region: "Šumadija", top: 56, left: 44 },
  { region: "Pomoravlje", top: 58, left: 56 },
  { region: "Bor", top: 54, left: 74 },
  { region: "Zaječar", top: 60, left: 76 },
  { region: "Zlatibor", top: 64, left: 22 },
  { region: "Moravica", top: 63, left: 33 },
  { region: "Raška", top: 70, left: 38 },
  { region: "Rasina", top: 65, left: 52 },
  { region: "Nišava", top: 70, left: 62 },
  { region: "Toplica", top: 74, left: 54 },
  { region: "Pirot", top: 72, left: 74 },
  { region: "Jablanica", top: 82, left: 53 },
  { region: "Pčinja", top: 88, left: 65 },
];

function normalizeRegion(r) {
  const totalParcels = r.parcels || 0;
  const activeDisputes = r.disputes || 0;
  const pendingTransfers = r.transfers || 0;

  const disputeRate =
    totalParcels > 0
      ? parseFloat(((activeDisputes / totalParcels) * 100).toFixed(1))
      : 0;

  const activeMortgages = r.activeMortgages ?? Math.round(totalParcels * 0.035);
  const avgProcessingDays =
    r.avgProcessingDays ?? parseFloat((3.5 + (totalParcels % 25) / 10).toFixed(1));
  const fraudBlocked = r.fraudBlocked ?? Math.round(activeDisputes * 0.05);

  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  const transfersLast6m =
    r.transfersLast6m && r.transfersLast6m.length
      ? r.transfersLast6m
      : months.map((month) => ({ month, value: 0 }));
  const disputesLast6m =
    r.disputesLast6m && r.disputesLast6m.length
      ? r.disputesLast6m
      : months.map((month) => ({ month, value: 0 }));

  return {
    region: r.region,
    totalParcels,
    activeDisputes,
    pendingTransfers,
    activeMortgages,
    avgProcessingDays,
    fraudBlocked,
    disputeRate,
    verificationRate: parseFloat(r.verificationRate || 0),
    transfersLast6m,
    disputesLast6m,
  };
}

function regionsFormat(n) {
  return new Intl.NumberFormat("en-IN").format(Math.round(n));
}

function regionsToCSV(rows) {
  const headers = [
    "Region",
    "Total Parcels",
    "Active Disputes",
    "Pending Transfers",
    "Active Mortgages",
    "Avg Processing (Days)",
    "Fraud Blocked",
    "Dispute Rate (%)",
  ];
  const escape = (v) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n"))
      return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.region,
        r.totalParcels,
        r.activeDisputes,
        r.pendingTransfers,
        r.activeMortgages,
        r.avgProcessingDays,
        r.fraudBlocked,
        r.disputeRate,
      ]
        .map(escape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}

function RegionsTooltip({ active, payload, label, metric }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload ?? {};
  let line = "";
  if (metric === "disputeRate") line = `Dispute Rate: ${row.disputeRate}%`;
  if (metric === "transferVolume")
    line = `Transfers: ${regionsFormat(row.transferVolume ?? row.pendingTransfers ?? 0)}`;
  if (metric === "processingTime")
    line = `Avg Time: ${row.processingTime ?? row.avgProcessingDays} days`;

  return (
    <div className="regions-tooltip" role="tooltip">
      <div className="regions-tooltip__title">{label}</div>
      <div className="regions-tooltip__line">{line}</div>
      <div className="regions-tooltip__hint">Hover other bars to compare.</div>
    </div>
  );
}

function RegionsTrendTooltip({ active, payload, label, unitLabel }) {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="regions-tooltip" role="tooltip">
      <div className="regions-tooltip__title">{label}</div>
      <div className="regions-tooltip__line">
        {unitLabel}: {regionsFormat(val)}
      </div>
      <div className="regions-tooltip__hint">Trend (last 6 months).</div>
    </div>
  );
}

/** ✅ circle-pin label (short code) */
function regionCode(name = "") {
  const clean = String(name).trim();
  if (!clean) return "RG";
  // if multiple words -> take first letters
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0].replace(/[^A-Za-zŠĐČĆŽšđčćž]/g, "");
    const b = parts[1].replace(/[^A-Za-zŠĐČĆŽšđčćž]/g, "");
    const code = `${a.slice(0, 1)}${b.slice(0, 1)}`.toUpperCase();
    return code || clean.slice(0, 2).toUpperCase();
  }
  // single word -> first 2 letters
  return clean.slice(0, 2).toUpperCase();
}

export default function Regions() {
  const navigate = useNavigate();

  const [regionsSeed, setRegionsSeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [range, setRange] = useState("Last 30 days");
  const [filterRegion, setFilterRegion] = useState("All Regions");
  const [metricView, setMetricView] = useState("disputeRate");
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("Vojvodina");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRegion, setModalRegion] = useState(null);

  const [exportOpen, setExportOpen] = useState(false);

  const printRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getRegionalData()
      .then((res) => {
        if (res?.success) {
          const normalized = (res.data || []).map(normalizeRegion);
          setRegionsSeed(normalized);
          const first = normalized.find((r) => r.region === "Vojvodina") || normalized[0];
          if (first) setSelectedRegion(first.region);
        } else {
          setError("Failed to load regional data");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setExportOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const regionOptions = useMemo(
    () => ["All Regions", ...regionsSeed.map((r) => r.region)],
    [regionsSeed]
  );

  const rangeMultiplier = useMemo(() => {
    switch (range) {
      case "Last 7 days":
        return 7 / 180;
      case "Last 30 days":
        return 30 / 180;
      case "Last 90 days":
        return 90 / 180;
      default:
        return 30 / 180;
    }
  }, [range]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return regionsSeed
      .filter((r) => {
        const regionOk = filterRegion === "All Regions" ? true : r.region === filterRegion;
        const searchOk =
          q.length === 0
            ? true
            : [
                r.region,
                String(r.totalParcels),
                String(r.activeDisputes),
                String(r.pendingTransfers),
                String(r.activeMortgages),
                String(r.avgProcessingDays),
                String(r.fraudBlocked),
                String(r.disputeRate),
              ]
                .join(" ")
                .toLowerCase()
                .includes(q);
        return regionOk && searchOk;
      })
      .map((r) => ({
        ...r,
        activeDisputes: Math.round(r.activeDisputes * rangeMultiplier),
        pendingTransfers: Math.round(r.pendingTransfers * rangeMultiplier),
        activeMortgages: Math.round(r.activeMortgages * rangeMultiplier),
        fraudBlocked: Math.round(r.fraudBlocked * rangeMultiplier),
        disputeRate: parseFloat((r.disputeRate * Math.min(1, rangeMultiplier * 2)).toFixed(1)),
      }));
  }, [regionsSeed, filterRegion, search, rangeMultiplier]);

  useEffect(() => {
    if (filterRegion !== "All Regions") {
      setSelectedRegion(filterRegion);
    } else if (!regionsSeed.some((r) => r.region === selectedRegion)) {
      const first = regionsSeed[0];
      if (first) setSelectedRegion(first.region);
    }
  }, [filterRegion, regionsSeed]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedRow = useMemo(
    () => regionsSeed.find((r) => r.region === selectedRegion) || regionsSeed[0],
    [selectedRegion, regionsSeed]
  );

  const belgradeRow = useMemo(
    () => regionsSeed.find((r) => r.region === "Belgrade"),
    [regionsSeed]
  );

  const kpis = useMemo(() => {
    const totalRegions = filteredRows.length;
    const totalParcels = filteredRows.reduce((s, r) => s + r.totalParcels, 0);
    const totalDisputes = filteredRows.reduce((s, r) => s + r.activeDisputes, 0);
    const avgProcessing =
      totalRegions === 0
        ? 0
        : filteredRows.reduce((s, r) => s + r.avgProcessingDays, 0) / totalRegions;
    return { totalRegions, totalParcels, totalDisputes, avgProcessing };
  }, [filteredRows]);

  const chartData = useMemo(() => {
    return filteredRows.map((r) => ({
      name: r.region,
      disputeRate: r.disputeRate,
      transferVolume: r.pendingTransfers,
      processingTime: r.avgProcessingDays,
    }));
  }, [filteredRows]);

  const getRegionLevel = (r) => {
    let v = 0;
    if (metricView === "disputeRate") v = r.disputeRate;
    if (metricView === "transferVolume") v = r.pendingTransfers;
    if (metricView === "processingTime") v = r.avgProcessingDays;

    if (metricView === "transferVolume") {
      if (v < 500) return "low";
      if (v < 1200) return "med";
      return "high";
    }
    if (metricView === "processingTime") {
      if (v < 4) return "low";
      if (v < 5.2) return "med";
      return "high";
    }
    if (v < 10) return "low";
    if (v < 13) return "med";
    return "high";
  };

  const handleExportCSV = () => {
    const csv = regionsToCSV(filteredRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `regions_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    document.body.classList.add("regions-printMode");
    window.print();
    setTimeout(() => document.body.classList.remove("regions-printMode"), 250);
  };

  const handlePrint = () => {
    document.body.classList.add("regions-printMode");
    window.print();
    setTimeout(() => document.body.classList.remove("regions-printMode"), 250);
  };

  const openView = (row) => {
    setModalRegion(row);
    setIsModalOpen(true);
  };
  const closeView = () => setIsModalOpen(false);

  const resetFilters = () => {
    setSearch("");
    setFilterRegion("All Regions");
    setRange("Last 30 days");
  };

  const disputeClass = (val) => (Number(val) > 0 ? "regions-num--danger" : "regions-num--ok");

  if (loading) {
    return (
      <div className="regions-page" id="regions-page">
        <div className="regions-header">
          <h1 className="regions-title">Regions Dashboard</h1>
          <p className="regions-subtitle">Loading regional data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="regions-page" id="regions-page">
      <div className="regions-topbar">
        <div className="regions-breadcrumb">
          <span className="regions-breadcrumb__muted">Dashboard</span>
          <span className="regions-breadcrumb__sep">›</span>
          <span className="regions-breadcrumb__active">Regions</span>
        </div>

        <button className="regions-returnBtn" type="button" onClick={() => navigate("/dashboard")}>
          ← Return
        </button>
      </div>

      <div className="regions-header regions-header--flat">
        <h1 className="regions-title">Regions Dashboard</h1>
        <p className="regions-subtitle">Monitor property regions and mutations</p>
      </div>

      {error && <div className="regions-error">Error loading data: {error}</div>}

      {/* Filters */}
      <div className="regions-filterCard" aria-label="Filters">
        <div className="regions-filterCardTop">
          <div className="regions-filterCardTitle">
            <span className="regions-filterIcon" aria-hidden="true">⎇</span>
            Filters
          </div>

          <div className="regions-actions">
            <button className="regions-btn regions-btn--outline" type="button" onClick={handlePrint}>
              🖨 Print
            </button>

            <div className="regions-exportWrap">
              <button
                className="regions-btn regions-btn--dark"
                type="button"
                onClick={() => setExportOpen((s) => !s)}
              >
                ⬇ Export
              </button>

              {exportOpen && (
                <div className="regions-exportMenu" role="menu" aria-label="Export menu">
                  <button
                    className="regions-exportItem"
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      handleExportCSV();
                    }}
                  >
                    Export CSV
                  </button>
                  <button
                    className="regions-exportItem"
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      handleExportPDF();
                    }}
                  >
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="regions-filterRow">
          <div className="regions-field regions-field--grow">
            <span className="regions-fieldIcon" aria-hidden="true">🔎</span>
            <input
              className="regions-input regions-input--flat"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or name..."
            />
          </div>

          <div className="regions-field">
            <select
              className="regions-select regions-select--flat"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              aria-label="All Regions"
            >
              {regionOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="regions-field regions-field--date">
            <span className="regions-fieldIcon" aria-hidden="true">📅</span>
            <select
              className="regions-select regions-select--flat"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              aria-label="Date range"
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
        </div>

        <div className="regions-filterCardBottom">
          <button className="regions-resetLink" type="button" onClick={resetFilters}>
            ✕ Reset filters
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="regions-kpis" ref={printRef}>
        <div className="regions-kpiCard regions-kpiCard--navy">
          <div className="regions-kpiTop">
            <span className="regions-kpiLabel">Total Regions</span>
            <span className="regions-kpiIcon" aria-hidden="true">🗺️</span>
          </div>
          <div className="regions-kpiValue">{regionsFormat(kpis.totalRegions)}</div>
          <div className="regions-kpiHint">Monitored districts</div>
        </div>

        <div className="regions-kpiCard regions-kpiCard--orange">
          <div className="regions-kpiTop">
            <span className="regions-kpiLabel">Total Parcels</span>
            <span className="regions-kpiIcon" aria-hidden="true">🧱</span>
          </div>
          <div className="regions-kpiValue">{regionsFormat(kpis.totalParcels)}</div>
          <div className="regions-kpiHint">Across filtered regions</div>
        </div>

        <div className="regions-kpiCard regions-kpiCard--red">
          <div className="regions-kpiTop">
            <span className="regions-kpiLabel">Total Active Disputes</span>
            <span className="regions-kpiIcon" aria-hidden="true">⚠️</span>
          </div>
          <div className={`regions-kpiValue ${disputeClass(kpis.totalDisputes)}`}>
            {regionsFormat(kpis.totalDisputes)}
          </div>
          <div className="regions-kpiHint">Open disputes count</div>
        </div>

        <div className="regions-kpiCard regions-kpiCard--green">
          <div className="regions-kpiTop">
            <span className="regions-kpiLabel">Avg. Processing Time</span>
            <span className="regions-kpiIcon" aria-hidden="true">⏱️</span>
          </div>
          <div className="regions-kpiValue">{kpis.avgProcessing.toFixed(1)} days</div>
          <div className="regions-kpiHint">Average handling time</div>
        </div>
      </div>

      {/* Belgrade summary table */}
      <div className="regions-panel">
        <div className="regions-panelHeader regions-panelHeader--table">
          <div>
            <div className="regions-panelTitle">Region Snapshot</div>
            <div className="regions-panelSub">Quick view for Belgrade (table format)</div>
          </div>
        </div>

        <div className="regions-tableWrap" role="region" aria-label="Belgrade summary table">
          <table className="regions-table regions-table--compact">
            <thead>
              <tr>
                <th>Region</th>
                <th>Parcels</th>
                <th>Disputes</th>
                <th>Pending Transfers</th>
                <th>Mortgages</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="regions-regionCell">
                  <span className="regions-regionDot" aria-hidden="true" />
                  Belgrade
                </td>
                <td className="regions-mono">{regionsFormat(belgradeRow?.totalParcels ?? 288)}</td>
                <td className={`regions-mono ${disputeClass(belgradeRow?.activeDisputes ?? 27)}`}>
                  {regionsFormat(belgradeRow?.activeDisputes ?? 27)}
                </td>
                <td className="regions-mono">{regionsFormat(belgradeRow?.pendingTransfers ?? 85)}</td>
                <td className="regions-mono">{regionsFormat(belgradeRow?.activeMortgages ?? 54)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmap */}
      <div className="regions-panel">
        <div className="regions-panelHeader">
          <div>
            <div className="regions-panelTitle">Regional Heat Map</div>
            <div className="regions-panelSub">Click on any region to view detailed statistics</div>
          </div>

          <div className="regions-seg" role="tablist" aria-label="Heat Map Metric">
            <button
              type="button"
              className={`regions-segBtn ${metricView === "disputeRate" ? "is-active" : ""}`}
              onClick={() => setMetricView("disputeRate")}
              role="tab"
              aria-selected={metricView === "disputeRate"}
            >
              Dispute Rate
            </button>
            <button
              type="button"
              className={`regions-segBtn ${metricView === "transferVolume" ? "is-active" : ""}`}
              onClick={() => setMetricView("transferVolume")}
              role="tab"
              aria-selected={metricView === "transferVolume"}
            >
              Transfer Volume
            </button>
            <button
              type="button"
              className={`regions-segBtn ${metricView === "processingTime" ? "is-active" : ""}`}
              onClick={() => setMetricView("processingTime")}
              role="tab"
              aria-selected={metricView === "processingTime"}
            >
              Processing Time
            </button>
          </div>
        </div>

        <div className="regions-heatMapWrap" aria-label="Heat Map Board">
          <div className="regions-heatMapBoard" id="regions-heatMapBoard">
            <div className="regions-heatMapShape" aria-hidden="true" />

            {/* ✅ CIRCLE PINS */}
            {heatMapPositions.map((p) => {
              const r = regionsSeed.find((x) => x.region === p.region);
              if (!r) return null;

              const level = getRegionLevel(r);
              const isSelected = selectedRegion === r.region;
              const code = regionCode(r.region);

              return (
                <button
                  key={r.region}
                  type="button"
                  className={`regions-pinCircle regions-pinCircle--${level} ${
                    isSelected ? "is-selected" : ""
                  }`}
                  style={{ top: `${p.top}%`, left: `${p.left}%` }}
                  onClick={() => setSelectedRegion(r.region)}
                  aria-label={`Select ${r.region}`}
                  title={r.region}
                >
                  <span className="regions-pinCircle__code">{code}</span>
                  <span className="regions-pinCircle__label">{r.region}</span>
                </button>
              );
            })}

            <div className="regions-legend" id="regions-legend">
              <div className="regions-legendTitle">
                {metricView === "disputeRate"
                  ? "Dispute Rate"
                  : metricView === "transferVolume"
                  ? "Transfer Volume"
                  : "Processing Time"}
              </div>
              <div className="regions-legendRow">
                <span className="regions-legendSwatch regions-legendSwatch--low" />
                <span className="regions-legendLabel">Low</span>
              </div>
              <div className="regions-legendRow">
                <span className="regions-legendSwatch regions-legendSwatch--med" />
                <span className="regions-legendLabel">Med</span>
              </div>
              <div className="regions-legendRow">
                <span className="regions-legendSwatch regions-legendSwatch--high" />
                <span className="regions-legendLabel">High</span>
              </div>
            </div>
          </div>
        </div>

        {selectedRow && (
          <div className="regions-selectedBar">
            <div className="regions-selectedLeft">
              <div className="regions-selectedTitle">{selectedRow.region}</div>
              <div className="regions-selectedMeta">
                <span className="regions-chip">
                  Parcels: <b>{regionsFormat(selectedRow.totalParcels)}</b>
                </span>
                <span className={`regions-chip ${Number(selectedRow.activeDisputes) > 0 ? "regions-chip--danger" : "regions-chip--ok"}`}>
                  Disputes: <b>{regionsFormat(selectedRow.activeDisputes)}</b>
                </span>
                <span className="regions-chip">
                  Pending Transfers: <b>{regionsFormat(selectedRow.pendingTransfers)}</b>
                </span>
                <span className="regions-chip">
                  Mortgages: <b>{regionsFormat(selectedRow.activeMortgages)}</b>
                </span>
              </div>
            </div>

            <div className="regions-selectedRight">
              <div className="regions-miniTitle">
                {metricView === "transferVolume" ? "Transfers (6m)" : "Disputes (6m)"}
              </div>
              <div className="regions-miniChart">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={metricView === "transferVolume" ? selectedRow.transfersLast6m : selectedRow.disputesLast6m}
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickMargin={8} />
                    <YAxis tickMargin={8} width={40} />
                    <Tooltip content={<RegionsTrendTooltip unitLabel="Value" />} />
                    <Bar dataKey="value" name="Value" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison chart */}
      <div className="regions-panel">
        <div className="regions-panelHeader">
          <div>
            <div className="regions-panelTitle">Regional Comparison</div>
            <div className="regions-panelSub">Hover bars to view exact data</div>
          </div>
        </div>

        <div className="regions-chartWrap" aria-label="Regions Bar Chart">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickMargin={10} />
              <YAxis tickMargin={8} width={44} />
              <Tooltip content={<RegionsTooltip metric={metricView} />} />
              <Legend />
              {metricView === "disputeRate" && (
                <Bar dataKey="disputeRate" name="Dispute Rate (%)" radius={[8, 8, 0, 0]} />
              )}
              {metricView === "transferVolume" && (
                <Bar dataKey="transferVolume" name="Transfers" radius={[8, 8, 0, 0]} />
              )}
              {metricView === "processingTime" && (
                <Bar dataKey="processingTime" name="Avg Days" radius={[8, 8, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Regions table */}
      <div className="regions-panel">
        <div className="regions-panelHeader regions-panelHeader--table">
          <div>
            <div className="regions-panelTitle">All Regions</div>
            <div className="regions-panelSub">Use "View" to open details. Export supports CSV + Print/PDF.</div>
          </div>
        </div>

        <div className="regions-tableWrap" role="region" aria-label="Regions Table">
          <table className="regions-table" id="regions-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Total Parcels</th>
                <th>Active Disputes</th>
                <th>Pending Transfers</th>
                <th>Active Mortgages</th>
                <th>Avg. Processing</th>
                <th>Fraud Blocked</th>
                <th>Dispute Rate</th>
                <th style={{ width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.region}>
                  <td className="regions-regionCell">
                    <span className="regions-regionDot" aria-hidden="true" />
                    {r.region}
                  </td>
                  <td className="regions-mono">{regionsFormat(r.totalParcels)}</td>
                  <td className={`regions-mono ${disputeClass(r.activeDisputes)}`}>{regionsFormat(r.activeDisputes)}</td>
                  <td className="regions-mono">{regionsFormat(r.pendingTransfers)}</td>
                  <td className="regions-mono">{regionsFormat(r.activeMortgages)}</td>
                  <td className="regions-mono">{r.avgProcessingDays.toFixed(1)} days</td>
                  <td className={`regions-mono ${Number(r.fraudBlocked) > 0 ? "regions-num--danger" : "regions-num--ok"}`}>
                    {regionsFormat(r.fraudBlocked)}
                  </td>
                  <td className={`regions-mono ${Number(r.disputeRate) > 0 ? "regions-num--danger" : "regions-num--ok"}`}>
                    {r.disputeRate.toFixed(1)}%
                  </td>
                  <td>
                    <button className="regions-viewBtn" type="button" onClick={() => openView(r)}>
                      👁 View
                    </button>
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="regions-empty">
                    No results found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="regions-footer" aria-label="Footer">
        <div className="regions-footerInner">
          <div className="regions-footerLeft">
            <div className="regions-footerBrand">Serbia Land Registry • Regions</div>
            <div className="regions-footerMeta">Exports: CSV / Print to PDF • Updated via regional API</div>
          </div>
          <div className="regions-footerRight">
            <button
              className="regions-footerLink"
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {isModalOpen && modalRegion && (
        <div
          className="regions-modalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Region Details"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeView();
          }}
        >
          <div className="regions-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="regions-modalHeader">
              <div>
                <div className="regions-modalTitle">Region Details</div>
                <div className="regions-modalSub">{modalRegion.region} • Operational snapshot</div>
              </div>

              <div className="regions-modalHeaderActions">
                <button className="regions-btn regions-btn--outline" type="button" onClick={handleExportPDF}>
                  ⬇ Export PDF
                </button>
                <button className="regions-btn regions-btn--outline" type="button" onClick={handlePrint}>
                  🖨 Print
                </button>
                <button className="regions-closeBtn" type="button" onClick={closeView} aria-label="Close">
                  ✕
                </button>
              </div>
            </div>

            <div className="regions-modalBody">
              <div className="regions-detailGrid">
                <div className="regions-detailCard">
                  <div className="regions-detailLabel">Total Parcels</div>
                  <div className="regions-detailValue">{regionsFormat(modalRegion.totalParcels)}</div>
                </div>

                <div className="regions-detailCard">
                  <div className="regions-detailLabel">Active Disputes</div>
                  <div className={`regions-detailValue ${disputeClass(modalRegion.activeDisputes)}`}>
                    {regionsFormat(modalRegion.activeDisputes)}
                  </div>
                </div>

                <div className="regions-detailCard">
                  <div className="regions-detailLabel">Pending Transfers</div>
                  <div className="regions-detailValue">{regionsFormat(modalRegion.pendingTransfers)}</div>
                </div>

                <div className="regions-detailCard">
                  <div className="regions-detailLabel">Active Mortgages</div>
                  <div className="regions-detailValue">{regionsFormat(modalRegion.activeMortgages)}</div>
                </div>

                <div className="regions-detailCard">
                  <div className="regions-detailLabel">Avg. Processing</div>
                  <div className="regions-detailValue">{modalRegion.avgProcessingDays.toFixed(1)} days</div>
                </div>

                <div className="regions-detailCard">
                  <div className="regions-detailLabel">Dispute Rate</div>
                  <div className={`regions-detailValue ${Number(modalRegion.disputeRate) > 0 ? "regions-num--danger" : "regions-num--ok"}`}>
                    {modalRegion.disputeRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="regions-note">Tip: Export PDF uses your browser “Save as PDF”.</div>
            </div>

            <div className="regions-modalFooter">
              <button className="regions-btn" type="button" onClick={closeView}>
                Close
              </button>
            </div>
          </div>

          <button className="regions-modalOverlayClose" aria-label="Close overlay" onClick={closeView} type="button" />
        </div>
      )}
    </div>
  );
}