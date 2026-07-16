import React, { useState, useEffect } from "react";
import { useTelemetry } from "../hooks/useTelemetry";
import { aqiService } from "../services/aqiService";
import { mapService } from "../services/mapService";
import { populationService } from "../services/populationService";
import MapComponent from "../components/MapComponent";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend as ChartLegend
} from "recharts";

import {
  Activity,
  Map as MapIcon,
  Cpu,
  Shield,
  Bell,
  AlertTriangle,
  FileText,
  RefreshCw,
  TrendingUp,
  Wind,
  Layers,
  CheckCircle,
  Clock,
  User,
  Plus
} from "lucide-react";

// City settings
const CITIES = {
  "Hyderabad": { center: [17.385044, 78.486671], zoom: 12 },
  "Bengaluru": { center: [12.971598, 77.594562], zoom: 12 },
  "Delhi NCR": { center: [28.613939, 77.209021], zoom: 11 }
};

export default function CommandCenter() {
  const [selectedCity, setSelectedCity] = useState("Hyderabad");
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, map, prediction, solutions, priority, alerts, reports
  const [selectedStation, setSelectedStation] = useState(null);
  
  // Simulation State
  const [simType, setSimType] = useState("factory");
  const [simScale, setSimScale] = useState(1);
  const [simCoords, setSimCoords] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Forecast state
  const [forecastStationId, setForecastStationId] = useState("");
  const [forecastDuration, setForecastDuration] = useState(72);
  const [forecastData, setForecastData] = useState(null);

  // Attribution detailed explanation state
  const [attributionDetail, setAttributionDetail] = useState(null);
  const [clickedSource, setClickedSource] = useState(null);

  // Advisory selector state
  const [advisoryWard, setAdvisoryWard] = useState("");
  const [advisoryData, setAdvisoryData] = useState(null);

  // Citizen report logging form state
  const [reportCat, setReportCat] = useState("Garbage burning");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [citizenReports, setCitizenReports] = useState([]);

  // Load telemetry
  const {
    telemetry,
    weather,
    enforcements,
    mitigations,
    alerts,
    loading,
    error,
    refresh
  } = useTelemetry(selectedCity);

  // Refresh citizen reports
  const fetchCitizenReports = async () => {
    try {
      const reps = await aqiService.getCitizenReports();
      setCitizenReports(reps);
    } catch (err) {
      console.error("Failed to load citizen reports:", err);
    }
  };

  useEffect(() => {
    fetchCitizenReports();
  }, []);

  // Update selected station when telemetry loads or city changes
  useEffect(() => {
    if (telemetry && telemetry.stations && telemetry.stations.length > 0) {
      setSelectedStation(telemetry.stations[0]);
    } else {
      setSelectedStation(null);
    }
    // Clear simulation on city change
    setSimCoords(null);
    setSimResult(null);
  }, [telemetry]);

  // Load detailed forecast when selected station changes
  useEffect(() => {
    if (selectedStation) {
      aqiService.getForecast(null, null, selectedStation.id)
        .then(data => setForecastData(data))
        .catch(err => console.error("Forecast fetch failed:", err));
      
      mapService.getSourceAttribution(selectedStation.id)
        .then(data => setAttributionDetail(data))
        .catch(err => console.error("Attribution fetch failed:", err));
    }
  }, [selectedStation]);

  // Load advisory when ward changes
  useEffect(() => {
    if (advisoryWard) {
      populationService.getCitizenAdvisory(selectedCity, advisoryWard)
        .then(data => setAdvisoryData(data))
        .catch(err => console.error("Advisory fetch failed:", err));
    } else if (telemetry?.stations?.length > 0) {
      // default to first station ward
      const defaultWard = telemetry.stations[0].ward;
      setAdvisoryWard(defaultWard);
    }
  }, [advisoryWard, selectedCity, telemetry]);

  // Handle map clicks in Simulation tab
  const handleMapClick = async (lat, lng) => {
    if (activeTab !== "prediction") return;
    
    setSimCoords({ lat, lng });
    setSimLoading(true);
    try {
      const res = await aqiService.runSimulation({
        project_type: simType,
        scale: parseInt(simScale),
        latitude: lat,
        longitude: lng
      });
      setSimResult(res);
    } catch (err) {
      console.error("Simulation run failed:", err);
    } finally {
      setSimLoading(false);
    }
  };

  // Dispatch inspection team handler
  const handleDispatchInspection = (ward, riskScore) => {
    alert(`DISPATCH ORDER GENERATED:\nWard: ${ward}\nPriority Risk: ${riskScore}/100\nEnforcement Team dispatched for dust suppression and boiler compliance checks.`);
    refresh(); // refresh state
  };

  // Report submission handler
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportDesc) return;

    // Use current map center coords as approximate location for simplicity
    const cityData = CITIES[selectedCity];
    const lat = cityData.center[0] + (Math.random() - 0.5) * 0.05;
    const lng = cityData.center[1] + (Math.random() - 0.5) * 0.05;
    
    try {
      await aqiService.submitCitizenReport({
        category: reportCat,
        description: reportDesc,
        latitude: lat,
        longitude: lng,
        ward: advisoryWard || telemetry?.stations[0]?.ward || "Central Hub"
      });
      
      setReportSuccess(true);
      setReportDesc("");
      fetchCitizenReports();
      refresh();
      setTimeout(() => setReportSuccess(false), 3000);
    } catch (err) {
      console.error("Report submit failed:", err);
    }
  };

  // Determine colors and names for Pie Chart cells
  const getPieData = () => {
    if (!attributionDetail) return [];
    return [
      { name: "Traffic", value: attributionDetail.traffic, color: "#3b82f6" },
      { name: "Construction", value: attributionDetail.construction, color: "#06b6d4" },
      { name: "Industrial", value: attributionDetail.industrial, color: "#ef4444" },
      { name: "Weather", value: attributionDetail.weather_factor, color: "#8b5cf6" },
      { name: "Agricultural", value: attributionDetail.agricultural, color: "#f97316" }
    ];
  };

  // Get dynamic text color for AQI levels
  const getAQITextColor = (aqi) => {
    if (aqi > 300) return "text-severe";
    if (aqi > 200) return "text-dangerous";
    if (aqi > 100) return "text-unhealthy";
    if (aqi > 50) return "text-moderate";
    return "text-safe";
  };

  const getAQIBadgeClass = (aqi) => {
    if (aqi > 300) return "bg-severe/10 text-severe border-severe/20";
    if (aqi > 200) return "bg-dangerous/10 text-dangerous border-dangerous/20";
    if (aqi > 100) return "bg-unhealthy/10 text-unhealthy border-unhealthy/20";
    if (aqi > 50) return "bg-moderate/10 text-moderate border-moderate/20";
    return "bg-safe/10 text-safe border-safe/20";
  };

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden text-text-primary">
      {/* 1. Left Command Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col z-20">
        {/* Sidebar Logo */}
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="bg-surface-light border border-border p-1.5 rounded-lg">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="4" fill="#1E293B" stroke="rgba(255,255,255,0.1)"/>
              <path d="M12 4V20M4 12H20" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="3" fill="#3B82F6"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">UrbanAQI</h1>
            <span className="text-[9px] text-text-muted font-semibold uppercase tracking-wider">Command Console</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "dashboard"
                ? "bg-accent-blue/10 text-white border-l-2 border-accent-blue"
                : "text-text-muted hover:text-white hover:bg-surface-light"
            }`}
          >
            <Activity className="w-4 h-4" /> Operations Overview
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "map"
                ? "bg-accent-blue/10 text-white border-l-2 border-accent-blue"
                : "text-text-muted hover:text-white hover:bg-surface-light"
            }`}
          >
            <MapIcon className="w-4 h-4" /> Live AQI Map Inspector
          </button>
          <button
            onClick={() => setActiveTab("prediction")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "prediction"
                ? "bg-accent-blue/10 text-white border-l-2 border-accent-blue"
                : "text-text-muted hover:text-white hover:bg-surface-light"
            }`}
          >
            <Cpu className="w-4 h-4 text-accent-cyan" /> Planning & Simulation
          </button>
          <button
            onClick={() => setActiveTab("solutions")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "solutions"
                ? "bg-accent-blue/10 text-white border-l-2 border-accent-blue"
                : "text-text-muted hover:text-white hover:bg-surface-light"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-safe" /> AI Source Attribution
          </button>
          <button
            onClick={() => setActiveTab("priority")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "priority"
                ? "bg-accent-blue/10 text-white border-l-2 border-accent-blue"
                : "text-text-muted hover:text-white hover:bg-surface-light"
            }`}
          >
            <Shield className="w-4 h-4 text-accent-purple" /> Emergency Priority
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "alerts"
                ? "bg-accent-blue/10 text-white border-l-2 border-accent-blue"
                : "text-text-muted hover:text-white hover:bg-surface-light"
            }`}
          >
            <span className="flex items-center gap-3">
              <Bell className="w-4 h-4" /> Live Alert Feeds
            </span>
            {alerts.length > 0 && (
              <span className="bg-severe/20 text-severe text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-severe/10">
                {alerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === "reports"
                ? "bg-accent-blue/10 text-white border-l-2 border-accent-blue"
                : "text-text-muted hover:text-white hover:bg-surface-light"
            }`}
          >
            <FileText className="w-4 h-4" /> Citizen Portal & Reports
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-[#0a0f19] text-[10px] text-text-muted space-y-1">
          <div className="flex justify-between">
            <span>Node Cluster:</span>
            <span className="text-safe font-semibold">Active ({telemetry?.stations?.length || 18})</span>
          </div>
          <div className="flex justify-between">
            <span>System SLA:</span>
            <span className="text-accent-cyan font-semibold">99.8% Online</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border/5 text-[9px]">
            <span>Version: v5.0.0-Gov</span>
            <button onClick={refresh} title="Force Refresh" className="text-accent-blue hover:text-white transition-colors">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Operations Controller Column */}
      <section className="w-80 border-r border-border bg-surface flex flex-col z-10 overflow-y-auto">
        {/* City Selector Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Operational City</span>
            {loading && <RefreshCw className="w-3.5 h-3.5 text-accent-cyan animate-spin" />}
          </div>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full bg-[#0a0f19] border border-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
          >
            {Object.keys(CITIES).map((c) => (
              <option key={c} value={c}>
                📍 {c} Hub
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Panels based on Sidebar Tab Selection */}
        <div className="p-4 flex-1 space-y-5">
          {/* TAB 1: OPERATIONS OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Operations Overview</h2>
                <p className="text-[10px] text-text-muted">Real-time municipal telemetry indices.</p>
              </div>

              {/* Status grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a0f19] border border-border p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-[9px] text-text-muted font-semibold leading-none mb-1">Average AQI</span>
                  <span className={`text-2xl font-extrabold ${getAQITextColor(telemetry?.average_aqi || 0)}`}>
                    {loading ? "..." : telemetry?.average_aqi}
                  </span>
                  <span className="text-[8px] text-text-muted">Spatial average</span>
                </div>
                <div className="bg-[#0a0f19] border border-border p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-[9px] text-text-muted font-semibold leading-none mb-1">Active Hotspots</span>
                  <span className="text-2xl font-extrabold text-white">
                    {loading ? "..." : telemetry?.active_hotspots_count}
                  </span>
                  <span className="text-[8px] text-text-muted">AQI &gt; 150</span>
                </div>
                <div className="bg-[#0a0f19] border border-border p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-[9px] text-text-muted font-semibold leading-none mb-1">Exposed Pop</span>
                  <span className="text-lg font-extrabold text-white">
                    {loading ? "..." : (telemetry?.exposed_population || 0).toLocaleString()}
                  </span>
                  <span className="text-[8px] text-text-muted">Vulnerable range</span>
                </div>
                <div className="bg-[#0a0f19] border border-border p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-[9px] text-text-muted font-semibold leading-none mb-1">Alerts Count</span>
                  <span className="text-2xl font-extrabold text-severe">
                    {loading ? "..." : telemetry?.alerts_count}
                  </span>
                  <span className="text-[8px] text-text-muted">Warnings active</span>
                </div>
              </div>

              {/* AQI Trend line */}
              <div className="bg-[#0a0f19] border border-border p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted font-bold">AQI Trend (24h)</span>
                  <span className="text-[9px] text-accent-blue font-semibold">{selectedStation?.name || "Loading..."}</span>
                </div>
                <div className="h-28 w-full">
                  {forecastData?.trend_24h ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData.trend_24h}>
                        <defs>
                          <linearGradient id="trendGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="timestamp" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <ChartTooltip
                          contentStyle={{ backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.08)" }}
                          itemStyle={{ fontSize: 10, color: "#fff" }}
                          labelStyle={{ fontSize: 9, color: "#9ca3af" }}
                        />
                        <Area type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#trendGlow)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-text-muted animate-pulse">Loading trend charts...</div>
                  )}
                </div>
                <div className="flex justify-between text-[9px] text-text-muted">
                  <span>24 Hours Ago</span>
                  <span>Predicted (Tomorrow): {forecastData?.forecasts?.[0]?.predicted_aqi || 220} AQI</span>
                </div>
              </div>

              {/* Weather summary */}
              <div className="bg-[#0a0f19] border border-border p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-text-muted font-bold">Atmospheric Summary</span>
                {weather ? (
                  <>
                    <p className="text-xs text-text-light font-medium">
                      ⛅ Temp: {weather.average_temperature}°C | 💧 Humidity: {weather.average_humidity}%
                    </p>
                    <p className="text-[10px] text-text-muted leading-tight">
                      💨 Wind Average: {weather.average_wind_speed} km/h. Local weather status: <strong>{weather.conditions}</strong>. Low wind conditions elevate pollutant stagnation risks.
                    </p>
                  </>
                ) : (
                  <div className="h-6 w-full bg-surface-light animate-pulse rounded"></div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE AQI MAP INSPECTOR */}
          {activeTab === "map" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live AQI Inspector</h2>
                <p className="text-[10px] text-text-muted">Inspect telemetry points and active calibrations.</p>
              </div>

              {/* Monitoring Stations list */}
              <div className="space-y-2">
                <span className="text-[10px] text-text-muted font-bold">Select Telemetry Node</span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {telemetry?.stations?.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStation(s)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs flex justify-between items-center transition-all ${
                        selectedStation?.id === s.id
                          ? "bg-accent-blue/10 border-accent-blue text-white"
                          : "bg-[#0a0f19] border-border text-text-muted hover:text-white"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold text-white truncate">{s.name}</p>
                        <p className="text-[9px] text-text-muted truncate">{s.ward}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getAQIBadgeClass(s.current_aqi)}`}>
                        {s.current_aqi}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sensor calibration card */}
              <div className="bg-[#0a0f19] border border-border p-3 rounded-lg space-y-2 text-xs">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Calibration Grid</span>
                <div className="flex justify-between items-center text-[11px]">
                  <span>Sentinel-5P Satellites:</span>
                  <span className="text-safe font-bold">● Synchronized</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span>Central Stations:</span>
                  <span className="text-safe font-bold">● Calibrated</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span>Community Mesh Nodes:</span>
                  <span className="text-unhealthy font-bold">● Maintenance (2)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FORECAST & AI SIMULATION */}
          {activeTab === "prediction" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Planning & Simulation</h2>
                <p className="text-[10px] text-text-muted">Simulate the impact of proposed construction proposals.</p>
              </div>

              <div className="space-y-3 bg-[#0a0f19] border border-border p-3 rounded-lg">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-muted font-bold">Development Proposal Type</label>
                  <select
                    value={simType}
                    onChange={(e) => { setSimType(e.target.value); setSimCoords(null); setSimResult(null); }}
                    className="bg-[#111827] border border-border rounded px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="factory">Heavy Industrial Manufacturing Plant</option>
                    <option value="highway">Multi-Lane Highway Expressway</option>
                    <option value="flyover">Road Flyover Construction Site</option>
                    <option value="diversion">Truck Logistics Traffic Diversion</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-muted font-bold">Project Footprint/Scale</label>
                  <select
                    value={simScale}
                    onChange={(e) => { setSimScale(e.target.value); setSimCoords(null); setSimResult(null); }}
                    className="bg-[#111827] border border-border rounded px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="1">Medium Scale (1x Emission)</option>
                    <option value="2">Large Scale Corridor (2x Emission)</option>
                    <option value="3">Mega Industrial Hub (3x Emission)</option>
                  </select>
                </div>

                <div className="text-[9px] text-accent-cyan bg-accent-cyan/5 border border-accent-cyan/10 p-2 rounded">
                  👉 <strong>To execute simulation:</strong> Select parameters above, then click anywhere on the Map viewport to set the development anchor point.
                </div>
              </div>

              {/* Simulation Result Card */}
              {simLoading && (
                <div className="bg-[#0a0f19] border border-border p-4 rounded-lg flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-5 h-5 text-accent-cyan animate-spin" />
                  <span className="text-[10px] text-text-muted">Modeling dispersion plumes...</span>
                </div>
              )}

              {simResult && !simLoading && (
                <div className="bg-surface-light border border-accent-cyan/30 p-3.5 rounded-lg space-y-3 shadow-glass-glow">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-accent-cyan font-bold uppercase">Simulation Results</span>
                    <span className="text-[9px] bg-severe/20 border border-severe/10 text-severe px-2 py-0.5 rounded font-bold">
                      {simResult.risk_level}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-text-muted">Projected Peak AQI:</span>
                    <span className="text-xl font-black text-severe">{simResult.projected_peak_aqi} AQI</span>
                  </div>

                  <div className="border-t border-border/10 pt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Exposed Population:</span>
                      <strong className="text-white">{simResult.exposed_population.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">🏥 Nearby Hospitals:</span>
                      <strong className="text-white">{simResult.infrastructure.hospitals}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">🏫 Nearby Schools:</span>
                      <strong className="text-white">{simResult.infrastructure.schools}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">💧 Water canals:</span>
                      <strong className="text-white">{simResult.infrastructure.water_bodies}</strong>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-border/10 pt-2 text-[10px]">
                    <p className="text-accent-blue font-bold">AI Explainability Rationale:</p>
                    <p className="text-text-muted leading-relaxed mt-1">{simResult.ai_reasoning}</p>
                  </div>

                  <button
                    onClick={() => { setSimCoords(null); setSimResult(null); }}
                    className="w-full bg-[#0a0f19] hover:bg-black border border-border hover:border-text-muted text-text-primary text-[10px] font-bold py-1.5 rounded transition-all"
                  >
                    Reset Simulation
                  </button>
                </div>
              )}

              {/* Standard Ward Forecast Sub-panel */}
              {!simResult && !simLoading && forecastData && (
                <div className="bg-[#0a0f19] border border-border p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-text-muted font-bold">AI Forecast Index</span>
                    <span className="text-[9px] bg-surface-light border border-border px-1.5 py-0.5 rounded text-white font-mono">
                      Conf: {forecastData.forecasts?.[0]?.confidence_score || 94}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {forecastData.forecasts?.map((f, idx) => {
                      const hr = idx === 0 ? "24h" : (idx === 1 ? "48h" : "72h");
                      return (
                        <div key={f.id} className="bg-[#111827] border border-border p-2 rounded">
                          <p className="text-[9px] text-text-muted font-semibold">{hr} Out</p>
                          <p className={`text-base font-black ${getAQITextColor(f.predicted_aqi)}`}>{f.predicted_aqi}</p>
                          <p className="text-[8px] text-text-muted">AQI</p>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="text-[9px] text-text-muted leading-relaxed bg-[#111827] p-2 rounded border border-border-light">
                    <strong>Predictive Rationale:</strong> {forecastData.forecasts?.[0]?.rationale}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI SOURCE ATTRIBUTION & MITIGATION */}
          {activeTab === "solutions" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Source Attribution</h2>
                <p className="text-[10px] text-text-muted">Calculated emission components for selected station.</p>
              </div>

              {attributionDetail ? (
                <div className="space-y-3">
                  {/* Recharts Pie Chart */}
                  <div className="h-40 w-full flex justify-center bg-[#0a0f19] border border-border rounded-lg p-2 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {getPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartLegend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          iconSize={8}
                          formatter={(value) => <span className="text-[9px] text-text-muted font-sans font-bold">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Percentage break downs click-to-explain */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-text-muted font-bold">Attribution Factors (Click to explain)</span>
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {getPieData().map((src) => (
                        <button
                          key={src.name}
                          onClick={() => setClickedSource(src.name)}
                          className={`p-1.5 rounded border flex flex-col justify-between ${
                            clickedSource === src.name
                              ? "bg-accent-blue/15 border-accent-blue text-white"
                              : "bg-[#0a0f19] border-border text-text-muted hover:text-white"
                          }`}
                        >
                          <span className="text-[8px] truncate">{src.name}</span>
                          <span className="text-[10px] font-extrabold" style={{ color: src.color }}>{src.value}%</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Click Rationale Explainability Box */}
                  {clickedSource && (
                    <div className="bg-surface-light border border-accent-blue/30 p-2.5 rounded-lg text-[10px] leading-relaxed">
                      <p className="font-bold text-white uppercase tracking-wider mb-1">AI Explanation: {clickedSource}</p>
                      {clickedSource === "Traffic" && (
                        <p className="text-text-muted">High density diesel cargo logistics along ring road intersections, spiked by morning commute queue bottlenecks between 8:00 AM - 10:30 AM.</p>
                      )}
                      {clickedSource === "Construction" && (
                        <p className="text-text-muted">Fugitive dust generation from municipal metro extensions and residential building projects. Lack of cover-sheet compliance in loose gravel stockpiles.</p>
                      )}
                      {clickedSource === "Industrial" && (
                        <p className="text-text-muted">Sulfur oxide and chemical stack venting from local manufacturing kilns during nocturnal operation cycles, aggravated by lower thermal boundaries.</p>
                      )}
                      {clickedSource === "Weather" && (
                        <p className="text-text-muted">Atmospheric confinement. Low horizontal dispersion vector (wind speed &lt; 5.0 km/h) combined with high humidity traps particulate aerosols near surface levels.</p>
                      )}
                      {clickedSource === "Agricultural" && (
                        <p className="text-text-muted">Biomass and stubble burning crop clearings in regional border farms. Transported to urban center by seasonal thermal drafts.</p>
                      )}
                    </div>
                  )}

                  {/* General AI Explainability Rationale */}
                  <div className="bg-[#0a0f19] border border-border p-3 rounded-lg text-[10px] leading-relaxed">
                    <p className="font-bold text-accent-cyan">Telemetry Inference Rationale:</p>
                    <p className="text-text-muted mt-1">{attributionDetail.explanation}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-20 flex items-center justify-center text-xs text-text-muted">Loading attribution splits...</div>
              )}
            </div>
          )}

          {/* TAB 5: PRIORITY ENFORCEMENT */}
          {activeTab === "priority" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Priority Mitigation Schedule</h2>
                <p className="text-[10px] text-text-muted">Recommended actions and ward priority indexes.</p>
              </div>

              {/* Mitigation policy schedules list */}
              <div className="space-y-3">
                <span className="text-[10px] text-text-muted font-bold">Active Policy Directives</span>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {mitigations.map((m) => (
                    <div key={m.id} className="bg-[#0a0f19] border border-border p-3 rounded-lg space-y-1.5 hover:border-accent-blue/20 transition-colors">
                      <div className="flex justify-between items-center text-[10px] font-bold text-white">
                        <span className="truncate pr-2">{m.title}</span>
                        <span className="text-safe font-mono">{m.improvement}</span>
                      </div>
                      <p className="text-[9px] text-text-muted leading-tight">{m.description}</p>
                      <div className="flex justify-between items-center text-[8px] text-text-muted pt-1 border-t border-border/5">
                        <span>Dept: {m.department}</span>
                        <span>ETA: <strong className="text-white">{m.eta}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SMART ALERTS FEED */}
          {activeTab === "alerts" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Smart Alerts Feed</h2>
                <p className="text-[10px] text-text-muted">System-generated anomalies and warnings.</p>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                  <div className="bg-[#0a0f19] border border-border p-4 rounded-lg text-center text-xs text-text-muted">
                    No active warnings. Calibration grid reports normal status.
                  </div>
                ) : (
                  alerts.map((a) => (
                    <div key={a.id} className="bg-red-950/10 border border-red-950/20 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-severe/20 border border-severe/10 text-severe px-1.5 py-0.5 rounded font-bold">
                          {a.severity}
                        </span>
                        <span className="text-[8px] text-text-muted">Active Warning</span>
                      </div>
                      <p className="text-[10px] font-medium text-white leading-tight">{a.message}</p>
                      <div className="text-[9px] bg-red-950/20 text-red-400 p-1.5 rounded leading-normal">
                        <strong>Directive:</strong> {a.suggested_action}
                      </div>
                      <div className="text-[8px] text-text-muted border-t border-red-950/10 pt-1 text-right">
                        Ward: {a.ward}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: CITIZEN PORTAL & ADVISORY */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Citizen Reporting Portal</h2>
                <p className="text-[10px] text-text-muted">Log incident reports for municipal crew dispatching.</p>
              </div>

              {/* Citizen advisory bulletin */}
              {advisoryData && (
                <div className="bg-[#0a0f19] border border-border p-3 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-border/10 pb-1">
                    <span className="text-[9px] text-text-muted uppercase font-bold">Advisory Bulletin: {advisoryData.ward}</span>
                    <span className={`font-bold ${getAQITextColor(advisoryData.current_aqi)}`}>
                      {advisoryData.health_level}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[10px] leading-tight">
                    <p>🧑‍⚕️ <strong>Advice:</strong> {advisoryData.advice}</p>
                    <p>😷 <strong>Mask recommendation:</strong> {advisoryData.mask_recommendation}</p>
                    <p>🏃‍♂️ <strong>Exercise timing:</strong> {advisoryData.exercise_timing}</p>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-border/5 text-[9px] text-text-muted">
                    <span>Current AQI: {advisoryData.current_aqi}</span>
                    <span>Tomorrow: {advisoryData.tomorrow_aqi} AQI</span>
                  </div>
                </div>
              )}

              {/* Submit report form */}
              <form onSubmit={handleReportSubmit} className="bg-[#0a0f19] border border-border p-3 rounded-lg space-y-3 text-xs">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Log Local Incident</span>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-text-muted leading-none">Pollution Category</label>
                  <select
                    value={reportCat}
                    onChange={(e) => setReportCat(e.target.value)}
                    className="bg-[#111827] border border-border rounded px-2.5 py-1 text-xs text-white"
                  >
                    <option value="Garbage burning">Garbage Burning / Open Fires</option>
                    <option value="Construction dust">Construction Dust / Loose Gravel</option>
                    <option value="Industrial smoke">Industrial Boiler Smoke</option>
                    <option value="Vehicle emissions">Heavy Transit Exhaust</option>
                    <option value="Illegal dumping">Waste/Debris Dumping</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-text-muted leading-none">Description & Location details</label>
                  <textarea
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Provide nearest landmarks, street context, or observed times..."
                    rows={2}
                    className="bg-[#111827] border border-border rounded px-2.5 py-1 text-xs text-white resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-accent-purple hover:bg-purple-600 text-white text-[10px] font-bold py-1.5 rounded transition-all shadow-glow hover:shadow-purple-500/30"
                >
                  Submit Incident Log
                </button>

                {reportSuccess && (
                  <p className="text-[9px] text-safe text-center font-bold">
                    ✓ Report submitted successfully. Added Map Pin.
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      </section>

      {/* 3. Center-Right GIS Map Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#090d16] p-4 relative z-0">
        {/* Top Control Bar */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">GIS Workspace</span>
            <span className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse"></span>
            <span className="text-[9px] text-text-muted font-mono bg-surface border border-border px-2 py-0.5 rounded">
              Scope: {selectedCity}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Export Controls */}
            <button
              onClick={() => aqiService.downloadReport("csv", selectedCity)}
              className="border border-border hover:border-text-muted bg-surface text-text-primary text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-text-muted" /> Export CSV
            </button>
            <button
              onClick={() => aqiService.downloadReport("pdf", selectedCity)}
              className="bg-surface hover:bg-surface-light border border-accent-blue/30 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-glow hover:shadow-blue-500/20"
            >
              <FileText className="w-3.5 h-3.5 text-accent-blue" /> Download PDF Report
            </button>
          </div>
        </div>

        {/* Map Viewport Grid */}
        <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-1 h-full relative">
            <MapComponent
              stations={telemetry?.stations || []}
              citizenReports={citizenReports}
              selectedStation={selectedStation}
              onSelectStation={(s) => {
                setSelectedStation(s);
                // Also toggle sidebar tab to inspector to see node lists
                setActiveTab("map");
              }}
              simulationCoords={simCoords}
              simulationRadius={simScale * 150} // in meters
              onMapClick={handleMapClick}
              cityCenter={CITIES[selectedCity].center}
              zoom={CITIES[selectedCity].zoom}
            />

            {/* Coordinates Floating Footer */}
            <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur border border-border px-3 py-1.5 rounded text-[9px] text-text-muted font-mono z-[1000]">
              LAT: {CITIES[selectedCity].center[0].toFixed(5)}° N | LNG: {CITIES[selectedCity].center[1].toFixed(5)}° E | SATELLITE: SENTINEL-5P
            </div>
            
            {/* Simulation overlay tip */}
            {activeTab === "prediction" && (
              <div className="absolute top-4 left-4 bg-accent-cyan/90 text-slate-900 border border-accent-cyan/30 px-3 py-2 rounded-lg text-[10px] font-bold z-[1000] shadow-glass-glow max-w-xs leading-tight">
                🔮 SIMULATION MODE ACTIVE: Click on any sector of the map to project pollutant dispersion.
              </div>
            )}
          </div>

          {/* Inline Right Priority Check Table (when on Priority Enforcement tab) */}
          {activeTab === "priority" && (
            <div className="w-96 h-full bg-surface border border-border rounded-xl flex flex-col p-4 space-y-3 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Priority Dispatch Inspection List</span>
                <span className="text-[9px] bg-accent-purple/10 border border-accent-purple/20 text-accent-purple px-2 py-0.5 rounded font-bold">
                  Ranked Risk Score
                </span>
              </div>

              {/* Telemetry Wards Priority Table */}
              <div className="flex-1 overflow-y-auto pr-1">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/10 text-text-muted text-[8px] font-bold uppercase">
                      <th className="pb-1.5">Ward / Station</th>
                      <th className="pb-1.5 text-center">AQI</th>
                      <th className="pb-1.5 text-center">Risk Score</th>
                      <th className="pb-1.5 text-right">Dispatch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enforcements.map((e) => {
                      let priorityColor = "text-safe";
                      if (e.priority === "Critical") priorityColor = "text-severe font-extrabold";
                      else if (e.priority === "High") priorityColor = "text-dangerous font-bold";
                      else if (e.priority === "Medium") priorityColor = "text-unhealthy";
                      
                      return (
                        <tr key={e.station_id} className="border-b border-border/5 hover:bg-surface-light/30 transition-colors">
                          <td className="py-2.5 font-medium truncate pr-2 max-w-[120px]">
                            <p className="text-white truncate font-bold">{e.ward}</p>
                            <p className="text-[8px] text-text-muted truncate">{e.main_source} source</p>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`font-bold ${getAQITextColor(e.current_aqi)}`}>
                              {e.current_aqi}
                            </span>
                          </td>
                          <td className="py-2.5 text-center font-bold text-white">
                            <span className="bg-[#0a0f19] px-2 py-1 rounded border border-border">
                              {e.risk_score}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => handleDispatchInspection(e.ward, e.risk_score)}
                              className="bg-accent-blue/15 hover:bg-accent-blue/35 text-accent-blue hover:text-white border border-accent-blue/20 text-[8px] font-bold px-2 py-1 rounded transition-all"
                            >
                              ⚡ Dispatch
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
