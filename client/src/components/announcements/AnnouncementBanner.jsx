import { useState, useEffect } from "react";
import { Megaphone, X, ChevronLeft, ChevronRight } from "lucide-react";

import useAnnouncements from "../../hooks/useAnnouncements";
import useTheme from "../../hooks/useTheme";

const DISMISSED_KEY = "zimhub-dismissed-announcements";

const AnnouncementBanner = () => {
  const { announcements, loading } = useAnnouncements(5);
  const { c, isDark } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      if (stored) setDismissedIds(JSON.parse(stored));
    } catch {}
  }, []);

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id),
  );

  /* Auto-rotate */
  useEffect(() => {
    if (visibleAnnouncements.length <= 1 || expanded) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev < visibleAnnouncements.length - 1 ? prev + 1 : 0,
      );
    }, 6000);
    return () => clearInterval(interval);
  }, [visibleAnnouncements.length, expanded]);

  useEffect(() => {
    if (currentIndex >= visibleAnnouncements.length) {
      setCurrentIndex(0);
    }
  }, [visibleAnnouncements.length, currentIndex]);

  const handleDismiss = (id) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(newDismissed));
    } catch {}

    if (currentIndex >= visibleAnnouncements.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev < visibleAnnouncements.length - 1 ? prev + 1 : 0,
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev > 0 ? prev - 1 : visibleAnnouncements.length - 1,
    );
  };

  if (loading || visibleAnnouncements.length === 0) return null;

  const current = visibleAnnouncements[currentIndex];
  if (!current) return null;

  const isLong = current.content?.length > 120;
  const showText =
    expanded || !isLong
      ? current.content
      : current.content.substring(0, 120).trim() + "...";

  // Subtle gradient that works in both themes
  const bannerBg = isDark
    ? `linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.12) 100%)`
    : `linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 100%)`;

  return (
    <div
      style={{
        background: bannerBg,
        border: `1px solid ${c.accent}30`,
        borderRadius: "14px",
        padding: "12px 14px",
        marginBottom: "12px",
        position: "relative",
        fontFamily: "Inter, system-ui, sans-serif",
        animation: "announceFadeIn 0.4s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "8px",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #3B82F6, #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
          }}
        >
          <Megaphone size={15} color="#ffffff" strokeWidth={2.5} />
        </div>

        {/* Title + counter */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "1px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: c.accent,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              📢 Announcement
            </span>
            {visibleAnnouncements.length > 1 && (
              <span
                style={{
                  fontSize: "10px",
                  color: c.textMuted,
                  fontWeight: 600,
                }}
              >
                · {currentIndex + 1} of {visibleAnnouncements.length}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: c.text,
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {current.title}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => handleDismiss(current.id)}
          style={{
            background: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.7)",
            border: "none",
            borderRadius: "8px",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: c.textTer,
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = c.danger;
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.7)";
            e.currentTarget.style.color = c.textTer;
          }}
          title="Dismiss"
        >
          <X size={13} />
        </button>
      </div>

      {/* Content */}
      <p
        style={{
          fontSize: "13px",
          color: c.textSec,
          margin: "0 0 8px",
          lineHeight: 1.55,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {showText}
      </p>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none",
                border: "none",
                color: c.accent,
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {visibleAnnouncements.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              onClick={handlePrev}
              style={{
                background: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(255,255,255,0.7)",
                border: "none",
                borderRadius: "6px",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: c.accent,
              }}
              aria-label="Previous"
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>

            <div style={{ display: "flex", gap: "4px", padding: "0 6px" }}>
              {visibleAnnouncements.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    width: currentIndex === idx ? "14px" : "6px",
                    height: "6px",
                    borderRadius: "3px",
                    border: "none",
                    background:
                      currentIndex === idx ? c.accent : c.borderStrong,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    padding: 0,
                  }}
                  aria-label={`Go to announcement ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              style={{
                background: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(255,255,255,0.7)",
                border: "none",
                borderRadius: "6px",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: c.accent,
              }}
              aria-label="Next"
            >
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes announceFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementBanner;
