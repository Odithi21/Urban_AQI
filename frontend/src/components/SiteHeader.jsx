import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Wind } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const links = [
  ["Feedback", "/contact"],
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return <header className="site-header">
    <div className="site-header__inner">
      <Link to="/" className="brand" aria-label="UrbanAQI home" onClick={close}>
        <span className="brand__mark"><Wind size={19} /></span>
        <span><strong>UrbanAQI</strong><small>Command Platform</small></span>
      </Link>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>
        {open ? <X /> : <Menu />}
      </button>
      <nav className={`site-nav ${open ? "site-nav--open" : ""}`} aria-label="Main navigation">
        {links.map(([label, to]) => <NavLink key={to} to={to} onClick={close}>{label}</NavLink>)}
        <NavLink to="/signin" onClick={close}>Sign in</NavLink>
        <ThemeToggle />
        <Link to="/dashboard" onClick={close} className="nav-cta">Open dashboard</Link>
      </nav>
    </div>
  </header>;
}
