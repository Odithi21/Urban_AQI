import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, BrainCircuit, Building2, ChevronRight, Cpu, HeartPulse, Map, Play, Shield, Users, X } from "lucide-react";
import { aqiService } from "../services/aqiService";
import PageShell from "../components/PageShell";

const workflow = [
  { title: "Collect", icon: Map, detail: "Sensor readings, meteorology and ward population grids are normalized into a common spatial model.", meta: "Inputs: station telemetry, weather, WorldPop" },
  { title: "Predict", icon: BrainCircuit, detail: "Short-horizon forecasting estimates how air quality will evolve at each monitored ward.", meta: "Output: ward-level AQI forecast with confidence" },
  { title: "Explain", icon: Cpu, detail: "Attribution scores identify the most likely contribution from traffic, construction, industry and weather.", meta: "Output: ranked source breakdown" },
  { title: "Act", icon: Shield, detail: "Risk scores prioritize enforcement and health guidance for the highest-exposure locations.", meta: "Output: recommended municipal action" },
];
const features = [
  ["aqi-intelligence", "Real-time AQI", "Live station conditions, trends and hotspot detection.", Activity],
  ["source-attribution", "Source attribution", "Explain which sources are driving local pollution.", Cpu],
  ["health-risk", "Health risk", "Translate exposure into practical, ward-specific guidance.", HeartPulse],
];

export default function Home() {
  const [telemetry, setTelemetry] = useState(null), [loading, setLoading] = useState(true), [selected, setSelected] = useState(null), [simulating, setSimulating] = useState(false);
  useEffect(() => { aqiService.getCurrentTelemetry().then(setTelemetry).catch(() => {}).finally(() => setLoading(false)); }, []);
  const stats = [["Active stations", telemetry?.stations?.length ?? "18"], ["City AQI baseline", telemetry?.average_aqi ?? "178"], ["Priority hotspots", telemetry?.active_hotspots_count ?? "4"]];
  return <PageShell>
    <main>
      <section className="hero">
        <span className="eyebrow"><Shield size={14}/> Government decision support</span>
        <h1>Air quality intelligence<br/><em>that turns data into action.</em></h1>
        <p>UrbanAQI brings telemetry, forecasting, source attribution and exposure risk into one clear operating picture for cities and communities.</p>
        <div className="hero__actions"><Link to="/dashboard" className="button button--primary">Open command center <ArrowRight size={17}/></Link><Link to="/architecture" className="button">Explore architecture</Link></div>
        <div className="stat-grid" aria-live="polite">{stats.map(([label, value]) => <div className="stat-card" key={label}><span>{label}</span><strong>{loading ? <i className="skeleton"/> : value}</strong></div>)}</div>
      </section>

      <section className="content-section contrast-section" aria-labelledby="comparison-heading"><div className="section-heading"><span>From reactive to proactive</span><h2 id="comparison-heading">Move the slider to compare operations</h2></div><Comparison /></section>
      <section className="content-section" aria-labelledby="roles-heading"><div className="section-heading"><span>Built for every decision maker</span><h2 id="roles-heading">Choose your view</h2></div><div className="role-grid">{[["admin","Municipal teams","Prioritize inspections and coordinate interventions.",Building2],["citizen","Citizens","Understand local conditions and report concerns.",Users],["researcher","Researchers","Explore trends, sources and methodology.",BrainCircuit]].map(([role,title,text,Icon])=><Link className="role-card" key={role} to={`/dashboards/${role}`}><Icon/><h3>{title}</h3><p>{text}</p><span>View dashboard <ChevronRight size={16}/></span></Link>)}</div></section>
      <section className="content-section contrast-section" aria-labelledby="workflow-heading"><div className="section-heading"><span>Explainable AI workflow</span><h2 id="workflow-heading">Every recommendation has a traceable path</h2></div><div className={`workflow ${simulating ? "workflow--playing" : ""}`}>{workflow.map((step, index) => { const Icon=step.icon; return <button key={step.title} onClick={() => setSelected(step)} className="workflow-node" aria-label={`View ${step.title} workflow details`}><b>0{index+1}</b><Icon/><strong>{step.title}</strong></button>; })}</div><button onClick={() => {setSimulating(true); setTimeout(()=>setSimulating(false), 4200)}} className="text-button"><Play size={15}/> Play simulation</button></section>
      <section className="content-section" aria-labelledby="features-heading"><div className="section-heading"><span>Platform modules</span><h2 id="features-heading">Explore key capabilities</h2></div><div className="feature-grid">{features.map(([slug,title,text,Icon])=><Link key={slug} to={`/features/${slug}`} className="feature-card"><Icon/><h3>{title}</h3><p>{text}</p><ArrowRight size={18}/></Link>)}</div></section>
    </main>
    {selected && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelected(null)} aria-label="Close details"><X/></button><span className="eyebrow">Workflow stage</span><h2 id="modal-title">{selected.title}</h2><p>{selected.detail}</p><div className="modal-meta">{selected.meta}</div></section></div>}
  </PageShell>;
}
function Comparison(){ const [value,setValue]=useState(50); return <div className="comparison"><div className="comparison__before" style={{width:`${value}%`}}><div><span>Before</span><h3>Fragmented response</h3><p>Delayed reports and broad citywide actions leave high-risk wards unseen.</p></div></div><div className="comparison__after"><div><span>With UrbanAQI</span><h3>Targeted response</h3><p>Forecast-led, ward-level actions focus effort where exposure is highest.</p></div></div><input aria-label="Compare before and after" type="range" min="5" max="95" value={value} onChange={e=>setValue(e.target.value)}/><span className="comparison__handle" style={{left:`${value}%`}} aria-hidden="true">↔</span></div> }
