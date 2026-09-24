"use client";

import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ theme, setTheme }) {
  const isDark = theme === "dark";
  return <button onClick={() => setTheme(isDark ? "light" : "dark")} title={`Switch to ${isDark ? "light" : "dark"} theme`} aria-label={`Switch to ${isDark ? "light" : "dark"} theme`} aria-pressed={isDark} className="theme-toggle grid h-10 w-10 place-items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-panel)] text-[var(--accent-coral)]"><span className={`theme-toggle-icon ${isDark ? "is-dark" : ""}`}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</span></button>;
}
