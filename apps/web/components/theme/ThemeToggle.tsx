"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme/theme-provider";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { mode, setMode, theme } = useTheme();

  const isDark = theme.mode === "dark";

  const toggle = () => {
    setMode(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      data-testid="theme-toggle"
      className={`p-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]/50 ${className}`}
      style={{
        color: "var(--color-foreground)",
        backgroundColor: "var(--color-muted)",
      }}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
