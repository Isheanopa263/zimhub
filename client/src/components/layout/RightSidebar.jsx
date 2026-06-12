import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, ChevronRight, Wifi, WifiOff } from "lucide-react";

import api from "../../api/axios";
import useTheme from "../../hooks/useTheme";

/* ─── Announcement Card ────────────────────────────────────────────────────── */
const AnnouncementCard = ({ announcement, c, isDark }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = announcement.content?.length > 100;

  const cardBg = isDark
    ? `linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(37,99,235,0.08) 100%)`
    : `linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(37,99,235,0.03) 100%)`;

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${c.accent}25`,
        borderRadius: "14px",
        padding: "14px",
        marginBottom: "10px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #3B82F6, #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Megaphone size={13} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: c.text,
              margin: 0,
              fontFamily: "Inter, sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {announcement.title}
          </p>
          <p
            style={{
              fontSize: "10px",
              color: c.textMuted,
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Admin
          </p>
        </div>
      </div>

      {/* Content */}
      <p
        style={{
          fontSize: "13px",
          color: c.textSec,
          margin: 0,
          fontFamily: "Inter, sans-serif",
          lineHeight: 1.5,
          overflow: expanded ? "visible" : "hidden",
          display: expanded ? "block" : "-webkit-box",
          WebkitLineClamp: expanded ? "none" : 3,
          WebkitBoxOrient: "vertical",
        }}
      >
        {announcement.content}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded((p) => !p)}
          style={{
            background: "none",
            border: "none",
            color: c.accent,
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "4px 0 0",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};

/* ─── Online Status ────────────────────────────────────────────────────────── */
const OnlineStatus = ({ c }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        borderRadius: "12px",
        background: isOnline ? c.successLight : c.dangerLight,
        border: `1px solid ${isOnline ? c.success : c.danger}30`,
      }}
    >
      {isOnline ? (
        <Wifi size={15} color={c.success} />
      ) : (
        <WifiOff size={15} color={c.danger} />
      )}
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: isOnline ? c.success : c.danger,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {isOnline ? "Connected" : "Offline"}
      </span>
    </div>
  );
};

/* ─── Quick Links ──────────────────────────────────────────────────────────── */
const QuickLinks = ({ c }) => {
  const navigate = useNavigate();

  const links = [
    { label: "Notice Board", path: "/notices" },
    { label: "Search Users", path: "/search?tab=users" },
    { label: "My Profile", path: "/profile" },
  ];

  return (
    <div>
      {links.map(({ label, path }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: c.textSec,
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "Inter, system-ui, sans-serif",
            transition: "all 0.15s ease",
            marginBottom: "2px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = c.bgHover;
            e.currentTarget.style.color = c.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = c.textSec;
          }}
        >
          <span>{label}</span>
          <ChevronRight size={14} />
        </button>
      ))}
    </div>
  );
};

/* ─── Right Sidebar ────────────────────────────────────────────────────────── */
const RightSidebar = () => {
  const { c, isDark } = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get("/announcements?limit=3");
        setAnnouncements(res.data?.data || []);
      } catch {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <aside
      style={{
        width: "280px",
        minWidth: "280px",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        background: c.bg,
      }}
    >
      {/* Announcements */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <h3
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: c.text,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            📢 Announcements
          </h3>
        </div>

        {loading ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: "80px",
                  borderRadius: "14px",
                  background: `linear-gradient(90deg, ${c.skeletonBase} 0%, ${c.skeletonShine} 50%, ${c.skeletonBase} 100%)`,
                  backgroundSize: "200% 100%",
                  animation: "rightShimmer 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : announcements.length > 0 ? (
          announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              c={c}
              isDark={isDark}
            />
          ))
        ) : (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: c.textMuted,
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              background: c.bgSubtle,
              borderRadius: "14px",
              border: `1px dashed ${c.borderStrong}`,
            }}
          >
            No announcements yet
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section>
        <h3
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: c.text,
            margin: "0 0 8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          🔗 Quick Links
        </h3>
        <QuickLinks c={c} />
      </section>

      {/* Status */}
      <section>
        <OnlineStatus c={c} />
      </section>

      {/* Footer */}
      <section style={{ marginTop: "auto" }}>
        <p
          style={{
            fontSize: "11px",
            color: c.textFaint,
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
            lineHeight: 1.6,
          }}
        >
          ZimHub © {new Date().getFullYear()}
          <br />
          Private Student Platform
        </p>
      </section>

      <style>{`
        @keyframes rightShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </aside>
  );
};

export default RightSidebar;
