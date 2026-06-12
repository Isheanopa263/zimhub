import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Theme store — manages dark/light mode
 * Persists choice to localStorage
 * Falls back to system preference on first visit
 */

const getInitialTheme = () => {
  // 1. Check stored preference
  try {
    const stored = JSON.parse(localStorage.getItem("zimhub-theme"));
    if (stored?.state?.theme) return stored.state.theme;
  } catch {}

  // 2. Fall back to system preference
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        set({ theme: next });
        applyTheme(next);
      },
    }),
    {
      name: "zimhub-theme",
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

/**
 * Apply theme to <html> element by setting CSS variables
 */
export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.setAttribute("data-theme", theme);

  // Tell mobile browsers about the theme color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", theme === "dark" ? "#0F172A" : "#F8FAFC");
  }
};

export default useThemeStore;
