import { Sun, Moon } from "lucide-react";
import useTheme from "../../hooks/useTheme";

/**
 * Floating theme toggle button — used on auth pages
 */
const ThemeToggleButton = ({ position = "top-right" }) => {
  const { isDark, toggleTheme } = useTheme();

  const positionStyles = {
    "top-right": { top: "20px", right: "20px" },
    "top-left": { top: "20px", left: "20px" },
  };

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "fixed",
        ...positionStyles[position],
        zIndex: 50,
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.15)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        transition: "all 0.2s ease",
        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.15)";
        e.currentTarget.style.transform = "scale(1.05) rotate(15deg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        e.currentTarget.style.transform = "scale(1) rotate(0deg)";
      }}
    >
      {isDark ? (
        <Sun size={18} strokeWidth={2.5} color="#FBBF24" />
      ) : (
        <Moon size={18} strokeWidth={2.5} color="#E0E7FF" fill="#E0E7FF" />
      )}
    </button>
  );
};

export default ThemeToggleButton;
