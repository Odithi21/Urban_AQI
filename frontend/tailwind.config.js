/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        surface: "#111827",
        "surface-light": "#1f2937",
        border: "rgba(255, 255, 255, 0.08)",
        "border-light": "rgba(255, 255, 255, 0.04)",
        
        // AQI Severity Scale
        safe: "#22c55e",       // Green
        moderate: "#3b82f6",   // Blue
        unhealthy: "#eab308",  // Yellow
        dangerous: "#f97316",  // Orange
        severe: "#ef4444",     // Red
        
        // Command Accents
        "accent-blue": "#3b82f6",
        "accent-cyan": "#06b6d4",
        "accent-purple": "#8b5cf6",
        
        text: {
          primary: "#f3f4f6",
          muted: "#9ca3af",
          light: "#d1d5db",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-glow": "0 8px 32px 0 rgba(6, 182, 212, 0.15)",
        glow: "0 0 15px rgba(59, 130, 246, 0.5)",
        "glow-green": "0 0 15px rgba(34, 197, 94, 0.5)",
        "glow-red": "0 0 15px rgba(239, 68, 68, 0.5)",
      }
    },
  },
  plugins: [],
}
