import useThemeStore, { applyTheme } from "../store/themeStore";
import { useEffect } from "react";

/**
 * useTheme — provides current theme + helper to access CSS variables
 *
 * Returns:
 *   theme: 'light' | 'dark'
 *   isDark: boolean
 *   toggleTheme: () => void
 *   c: shortcut object with CSS var helper { c.bg, c.text, c.accent, ... }
 */
const useTheme = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore();

  // Re-apply theme on mount in case localStorage was modified externally
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const isDark = theme === "dark";

  /* Shortcut to CSS variables — use in inline styles */
  const c = {
    // Backgrounds
    bg: "var(--bg-app)",
    bgCard: "var(--bg-card)",
    bgElevated: "var(--bg-elevated)",
    bgSubtle: "var(--bg-subtle)",
    bgHover: "var(--bg-hover)",
    bgActive: "var(--bg-active)",
    bgInput: "var(--bg-input)",

    // Text
    text: "var(--text-primary)",
    textSec: "var(--text-secondary)",
    textTer: "var(--text-tertiary)",
    textMuted: "var(--text-muted)",
    textFaint: "var(--text-faint)",
    textInverse: "var(--text-inverse)",

    // Borders
    border: "var(--border-default)",
    borderStrong: "var(--border-strong)",

    // Brand
    accent: "var(--accent)",
    accentHover: "var(--accent-hover)",
    accentLight: "var(--accent-light)",
    accentText: "var(--accent-text)",

    // Status
    success: "var(--success)",
    successLight: "var(--success-light)",
    warning: "var(--warning)",
    warningLight: "var(--warning-light)",
    danger: "var(--danger)",
    dangerLight: "var(--danger-light)",

    // Shadows
    shadowSm: "var(--shadow-sm)",
    shadowMd: "var(--shadow-md)",
    shadowLg: "var(--shadow-lg)",

    // Skeletons
    skeletonBase: "var(--skeleton-base)",
    skeletonShine: "var(--skeleton-shine)",
  };

  return { theme, isDark, toggleTheme, setTheme, c };
};

export default useTheme;
