import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Map, Activity, Cpu, ArrowRight, Layers, Heart, Users } from "lucide-react";
import { aqiService } from "../services/aqiService";

export default function Home() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aqiService.getCurrentTelemetry()
      .then((data) => {
        setTelemetry(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load telemetry on landing page:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden text-text-primary selection:bg-accent-blue/30 selection:text-white">
      {/* Premium Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-surface-light border border-border p-2 rounded-lg">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="4" fill="#1e293b" stroke="rgba(255,255,255,0.1)"/>
              <path d="M12 4V20M4 12H20" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="3" fill="#3b82f6"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">UrbanAQI</h1>
            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Command Platform</span>
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <Link to="/architecture" className="text-sm font-medium text-text-muted hover:text-white transition-colors flex items-center gap-1">
            <Layers className="w-4 h-4 text-accent-cyan" /> View Architecture
          </Link>
          <Link to="/dashboard" className="bg-accent-blue hover:bg-blue-600 text-white font-bold text-sm px-4 py-2 rounded-lg transition-all shadow-glow hover:shadow-blue-500/30 flex items-center gap-1.5">
            Explore Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Glow backing */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-accent-cyan/5 rounded-full blur-[90px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-blue/20 bg-accent-blue/5 text-accent-blue text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse-slow">
          <Shield className="w-3.5 h-3.5" /> Government Decision Support System
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.1] font-outfit mb-6">
          Smart City Environmental <br />
          <span className="bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-purple bg-clip-text text-transparent">
            Air Quality Intelligence
          </span>
        </h1>

        <p className="text-base md:text-lg text-text-muted max-w-2xl leading-relaxed mb-10">
          Integrating real-time spatial telemetry, automated meteorological forecasting, and AI source attribution. A production-ready command platform built for Pollution Boards, Command Centers, and Municipal Corporations.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center mb-16">
          <Link to="/dashboard" className="w-full sm:w-auto bg-accent-blue hover:bg-blue-600 text-white font-bold px-8 py-3.5 rounded-lg transition-all shadow-glow hover:shadow-blue-500/40 flex items-center justify-center gap-2 group">
            Open Command Center <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/architecture" className="w-full sm:w-auto border border-border hover:border-slate-700 bg-surface/50 hover:bg-surface text-text-primary font-semibold px-8 py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            <Layers className="w-4 h-4 text-text-muted" /> Platform Architecture
          </Link>
        </div>

        {/* Live Platform Quick Stats */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left relative z-10">
          <div className="bg-surface/50 border border-border p-6 rounded-xl backdrop-blur-sm hover:border-accent-blue/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Live System Telemetry</span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-safe"></span>
              </span>
            </div>
            
            {loading ? (
              <div className="h-10 w-24 bg-surface-light animate-pulse rounded"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{telemetry?.stations?.length || 18}</span>
                <span className="text-xs text-text-muted">Sensor Nodes Active</span>
              </div>
            )}
            <p className="text-xs text-text-muted mt-2">Connecting real-time government monitors & weather satellite sensors.</p>
          </div>

          <div className="bg-surface/50 border border-border p-6 rounded-xl backdrop-blur-sm hover:border-accent-cyan/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">City AQI Baseline</span>
              <Activity className="w-4 h-4 text-accent-cyan" />
            </div>
            {loading ? (
              <div className="h-10 w-24 bg-surface-light animate-pulse rounded"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{telemetry?.average_aqi || 178}</span>
                <span className="text-xs text-text-muted">Avg AQI</span>
              </div>
            )}
            <p className="text-xs text-text-muted mt-2">Weighted average index calculation across municipal districts.</p>
          </div>

          <div className="bg-surface/50 border border-border p-6 rounded-xl backdrop-blur-sm hover:border-accent-purple/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Smart Dispatch List</span>
              <Shield className="w-4 h-4 text-accent-purple" />
            </div>
            {loading ? (
              <div className="h-10 w-24 bg-surface-light animate-pulse rounded"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{telemetry?.active_hotspots_count || 4}</span>
                <span className="text-xs text-text-muted">Critical Hotspots</span>
              </div>
            )}
            <p className="text-xs text-text-muted mt-2">Automated priority scheduling for municipal dust suppression.</p>
          </div>
        </div>
      </section>

      {/* Core Platform Modules */}
      <section className="bg-surface/30 border-t border-border py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit text-center mb-12">
            Platform Capabilities & Service Layers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-surface border border-border p-6 rounded-xl hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue rounded-lg flex items-center justify-center mb-4">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">GIS Interactive Map</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Leaflet-driven GIS overlay mapping station nodes, hotspots, sensitive school/hospital infrastructure, and dispersion plume buffers.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-surface border border-border p-6 rounded-xl hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan rounded-lg flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI Explainability & Attribution</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Quantifies emission attribution shares (traffic, industrial boilers, construction, regional weather) using real-time local vectors.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-surface border border-border p-6 rounded-xl hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-accent-purple/10 border border-accent-purple/20 text-accent-purple rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Priority Dispatch Enforcement</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Evaluates a mathematical risk score combining live AQI, forecast direction, and WorldPop population weights to dispatch mitigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8 px-6 text-center text-xs text-text-muted">
        <p>© 2026 Municipal Environmental Command Hub. All telemetry classification restricted. Powered by FastAPI & React.</p>
      </footer>
    </div>
  );
}
