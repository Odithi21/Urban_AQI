import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";
export default function NotFound(){return <PageShell><main className="page-wrap center-page"><span className="eyebrow">404</span><h1 className="page-title">This view does not exist.</h1><p className="page-lead">The link may be outdated or the page may have moved.</p><Link to="/" className="button button--primary">Return home</Link></main></PageShell>}
