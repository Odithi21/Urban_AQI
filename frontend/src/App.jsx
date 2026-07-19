import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";

const Home = lazy(() => import("./pages/Home"));
const CommandCenter = lazy(() => import("./pages/CommandCenter"));
const Architecture = lazy(() => import("./pages/Architecture"));
const RoleDashboard = lazy(() => import("./pages/RoleDashboard"));
const FeatureDetail = lazy(() => import("./pages/FeatureDetail"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Suspense fallback={<div className="route-loader" role="status">Loading UrbanAQI...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<CommandCenter />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/dashboards/:role" element={<RoleDashboard />} />
            <Route path="/features/:feature" element={<FeatureDetail />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signin" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}
