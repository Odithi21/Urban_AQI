import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ compact = false }) {
  const { isLight, toggleTheme } = useTheme();
  const label = isLight ? "Switch to dark theme" : "Switch to light theme";

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? "theme-toggle--compact" : ""}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {isLight ? <Moon size={17} /> : <Sun size={17} />}
      {!compact && <span>{isLight ? "Dark" : "Light"}</span>}
    </button>
  );
}
