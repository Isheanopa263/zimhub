import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Check,
  Inbox,
  Type,
  ImagePlus,
  Video,
  Link2,
} from "lucide-react";
import useTheme from "../../hooks/useTheme";

const FILTER_OPTIONS = [
  { key: "all", label: "All Posts", icon: Inbox, color: "#64748b" },
  { key: "text", label: "Text", icon: Type, color: "#8b5cf6" },
  { key: "image", label: "Photos", icon: ImagePlus, color: "#3B82F6" },
  { key: "video", label: "Videos", icon: Video, color: "#ef4444" },
  { key: "link", label: "Links", icon: Link2, color: "#10b981" },
];

const FilterDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef();
  const { c } = useTheme();

  const current =
    FILTER_OPTIONS.find((o) => o.key === value) || FILTER_OPTIONS[0];
  const CurrentIcon = current.icon;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "9px 14px",
          background: c.bgCard,
          border: `1.5px solid ${open ? c.accent : c.borderStrong}`,
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
          color: c.text,
          fontFamily: "Inter, sans-serif",
          transition: "all 0.15s ease",
          minWidth: "150px",
          boxShadow: open ? `0 0 0 3px ${c.accent}20` : c.shadowSm,
        }}
      >
        <CurrentIcon size={15} color={current.color} strokeWidth={2.5} />
        <span style={{ flex: 1, textAlign: "left" }}>{current.label}</span>
        <ChevronDown
          size={15}
          color={c.textMuted}
          style={{
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: "200px",
            background: c.bgCard,
            borderRadius: "14px",
            border: `1px solid ${c.border}`,
            boxShadow: c.shadowLg,
            padding: "6px",
            zIndex: 50,
            animation: "dropdownIn 0.15s ease-out",
          }}
        >
          {FILTER_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = opt.key === value;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  background: isActive ? `${opt.color}15` : "transparent",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? opt.color : c.text,
                  fontFamily: "Inter, sans-serif",
                  transition: "background 0.1s ease",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = c.bgHover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon
                  size={15}
                  color={opt.color}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span style={{ flex: 1 }}>{opt.label}</span>
                {isActive && (
                  <Check size={14} color={opt.color} strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default FilterDropdown;
