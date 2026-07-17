import { useState } from "react";
import { Database, Server, Cpu, Layout, X } from "lucide-react";
import PageShell from "../components/PageShell";
import Breadcrumbs from "../components/Breadcrumbs";

const layers = [
  ["Data ingestion", "Data sources are normalized into a single ward-aware stream.", "data.gov.in · Open-Meteo · WorldPop CSV", Database, "Inputs", "Station telemetry, weather observations, geographic coordinates and local population grids."],
  ["Data store", "A local relational model retains stations, history, forecasts, alerts and reports.", "SQLite · SQLAlchemy", Server, "Outputs", "Query-ready telemetry, historical trendlines and operation records."],
  ["AI services", "Forecasting, attribution, risk scoring and recommendations form the decision layer.", "FastAPI routes · transparent scoring", Cpu, "Technologies", "Forecast and source scoring are provided through documented REST endpoints."],
  ["Command experience", "Role-aware views present the right detail to operators, citizens and researchers.", "React · Leaflet · Recharts", Layout, "Experience", "Maps, trend charts, recommendations, citizen reports and downloadable reports."],
];
export default function Architecture(){const [active,setActive]=useState(null);return <PageShell><main className="page-wrap"><Breadcrumbs items={[{label:"Architecture"}]}/><span className="eyebrow">Technical blueprint</span><h1 className="page-title">Platform architecture</h1><p className="page-lead">Select a layer to inspect how information moves from observation to action.</p><div className="architecture-flow">{layers.map(([title,desc,tech,Icon,label,detail],i)=><button className="architecture-layer" key={title} onClick={()=>setActive({title,desc,tech,Icon,label,detail})}><span>Layer 0{i+1}</span><Icon/><div><strong>{title}</strong><p>{desc}</p><small>{tech}</small></div></button>)}</div></main>{active&&<div className="modal-backdrop" onMouseDown={()=>setActive(null)}><section className="modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={()=>setActive(null)}><X/></button><active.Icon/><h2>{active.title}</h2><p>{active.desc}</p><div className="modal-meta"><strong>{active.label}:</strong> {active.detail}</div><div className="modal-meta"><strong>Stack:</strong> {active.tech}</div></section></div>}</PageShell>}
