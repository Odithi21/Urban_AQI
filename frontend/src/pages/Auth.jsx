import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { Activity, ArrowRight, Bell, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import PageShell from "../components/PageShell";

const trustSignals = [
  ["Live AQI telemetry", Activity],
  ["Verified municipal access", ShieldCheck],
  ["Alert-ready workflows", Bell],
];

export default function Auth() {
  const { pathname } = useLocation();
  const [mode, setMode] = useState(pathname.includes("signup") ? "signup" : "signin");
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";

  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const name = form.get("name") || "";
    const email = form.get("email");
    const password = form.get("password");

    try {
      if (isSignup) {
        const res = await apiRequest("/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password })
        });
        // store minimal user info locally
        localStorage.setItem("user", JSON.stringify(res));
        navigate("/dashboard");
      } else {
        const res = await apiRequest("/signin", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem("user", JSON.stringify(res));
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Auth failed:", err);
      alert(err.message || "Authentication error");
    }
  }

  return (
    <PageShell>
      <main className="auth-page">
        <section className="auth-hero" aria-labelledby="auth-title">
          <span className="eyebrow"><ShieldCheck size={14} /> Secure access</span>
          <h1 id="auth-title">{isSignup ? "Join the UrbanAQI operations network." : "Welcome back to UrbanAQI command."}</h1>
          <p>
            Access ward intelligence, forecast alerts, reports, and operational workflows from one calm control surface.
          </p>
          <div className="auth-signal-grid">
            {trustSignals.map(([label, Icon]) => (
              <div className="auth-signal" key={label}>
                <Icon size={18} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="auth-panel" aria-label={isSignup ? "Create account" : "Sign in"}>
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button type="button" className={!isSignup ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
            <button type="button" className={isSignup ? "active" : ""} onClick={() => setMode("signup")}>Sign up</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {isSignup && (
              <label>
                Full name
                <span className="auth-input">
                  <UserRound size={16} />
                  <input required name="name" autoComplete="name" placeholder="Aarav Mehta" />
                </span>
              </label>
            )}

            <label>
              Work email
              <span className="auth-input">
                <Mail size={16} />
                <input required name="email" type="email" autoComplete="email" placeholder="you@city.gov" />
              </span>
            </label>

            <label>
              Password
              <span className="auth-input">
                <LockKeyhole size={16} />
                <input
                  required
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="Enter password"
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            {/* Roles removed: single shared dashboard for all users */}

            {!isSignup && (
              <div className="auth-row">
                <label className="auth-check"><input type="checkbox" /> Keep me signed in</label>
                <a href="#reset">Forgot password?</a>
              </div>
            )}

            <button className="button button--primary auth-submit" type="submit">
              {isSignup ? "Create account" : "Enter command center"} <ArrowRight size={16} />
            </button>
          </form>

          <p className="auth-note">
            {isSignup ? "Already cleared for access?" : "Need access for your team?"}{" "}
            <button type="button" onClick={() => setMode(isSignup ? "signin" : "signup")}>
              {isSignup ? "Sign in" : "Request an account"}
            </button>
          </p>
          <Link className="auth-dashboard-link" to="/dashboard">Continue to local demo dashboard</Link>
        </section>
      </main>
    </PageShell>
  );
}
