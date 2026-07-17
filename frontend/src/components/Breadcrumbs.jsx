import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ items }) {
  return <nav aria-label="Breadcrumb" className="breadcrumbs"><Link to="/">Home</Link>{items.map((item, i) => <span key={item.label}><ChevronRight size={14} />{item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current={i === items.length - 1 ? "page" : undefined}>{item.label}</span>}</span>)}</nav>;
}
