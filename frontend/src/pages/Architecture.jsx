import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Cpu, Database, Layout, Shield, Server, FileText } from "lucide-react";

export default function Architecture() {
  return (
    <div className="min-h-screen bg-background text-text-primary font-sans p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-white font-outfit mb-3">Platform Architecture Diagram</h1>
          <p className="text-sm text-text-muted">
            Technical blueprint of the Urban Air Quality Intelligence Platform outlining data flow and future Agent integrations.
          </p>
        </div>

        {/* Modular Layers */}
        <div className="space-y-8">
          {/* Layer 1 */}
          <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
            <div className="absolute right-4 top-4 font-mono text-[10px] text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">
              LAYER 1
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent-cyan/10 text-accent-cyan rounded-lg">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">Data Ingestion Pipeline</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  A modular Python pipeline running asynchronously. Connects directly to government repositories (data.gov.in) and meteorological forecasting systems (Open-Meteo). Fuses coordinates with demographic maps (WorldPop CSV).
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-text-muted">
                  <span className="bg-surface-light border border-border px-2 py-0.5 rounded">data.gov.in API</span>
                  <span className="bg-surface-light border border-border px-2 py-0.5 rounded">Open-Meteo API</span>
                  <span className="bg-surface-light border border-border px-2 py-0.5 rounded">WorldPop Dataset</span>
                </div>
              </div>
            </div>
          </div>

          {/* Layer 2 */}
          <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
            <div className="absolute right-4 top-4 font-mono text-[10px] text-accent-purple bg-accent-purple/10 px-2 py-0.5 rounded">
              LAYER 2
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent-purple/10 text-accent-purple rounded-lg">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">Relational Data Store</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  SQL database managing spatial indices. The platform models telemetry configurations, sensor history logs, active warnings, citizen complaints, and ward population sizes. Compatible with SQLite and PostgreSQL + PostGIS.
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-text-muted">
                  <span className="bg-surface-light border border-border px-2 py-0.5 rounded">SQLAlchemy ORM</span>
                  <span className="bg-surface-light border border-border px-2 py-0.5 rounded">PostGIS Spatial Mapping</span>
                  <span className="bg-surface-light border border-border px-2 py-0.5 rounded">SQLite Local Storage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Layer 3 */}
          <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
            <div className="absolute right-4 top-4 font-mono text-[10px] text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">
              LAYER 3
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent-blue/10 text-accent-blue rounded-lg">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">Future AI Agent Placeholders</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  The FastAPI microservice maps dedicated routes which are prepped for standalone agent integration:
                </p>
                <ul className="list-disc list-inside text-xs text-text-muted space-y-1 ml-2">
                  <li><strong>Forecast Agent:</strong> Neural time-series forecaster.</li>
                  <li><strong>Attribution Agent:</strong> Emission component solver.</li>
                  <li><strong>Health Risk Agent:</strong> Demographic vulnerability assessor.</li>
                  <li><strong>Enforcement Agent:</strong> Operations dispatcher routing municipal field crews.</li>
                  <li><strong>Citizen Advisory Agent:</strong> Compiler for individual health bulletins.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Layer 4 */}
          <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
            <div className="absolute right-4 top-4 font-mono text-[10px] text-safe bg-safe/10 px-2 py-0.5 rounded">
              LAYER 4
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-safe/10 text-safe rounded-lg">
                <Layout className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">Command Center Frontend</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  A responsive dashboard built with React and TailwindCSS. Uses LeafletJS and OpenStreetMap for mapping telemetry. Renders Recharts for AQI trends, forecast predictions, and source attribution shares.
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-text-muted">
                  <span className="bg-surface-light border border-border px-2 py-0.5 rounded">ReactJS</span>
                  <span className="bg-surface-light border border-border px-2 py-0.5 rounded">TailwindCSS</span>
                  <span className="bg-surface-light border border-border px-2 py-0.5 rounded">LeafletJS</span>
                  <span className="bg-surface-light border border-border px-2 py-0.5 rounded">Recharts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/dashboard" className="bg-accent-blue hover:bg-blue-600 text-white font-bold text-sm px-6 py-3 rounded-lg transition-all shadow-glow hover:shadow-blue-500/30 inline-flex items-center gap-2">
            Proceed to Command Center <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
