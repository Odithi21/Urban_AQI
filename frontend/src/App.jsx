import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CommandCenter from "./pages/CommandCenter";
import Architecture from "./pages/Architecture";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<CommandCenter />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
