import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, ChevronRight, Wifi, WifiOff } from "lucide-react";
import api from "../../api/axios";

/* ─── Announcement Card ────────────────────────────────────────────────────── */
const AnnouncementCard = ({ announcement }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = announcement.content?.length > 100;

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(37,99,235,0.03) 100%)",
        border: "1px solid rgba(59,130,246,0.15)",
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
              color: "#0F172A",
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
              color: "#94a3b8",
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
          color: "#475569",
          margin: 0,
          fontFamily: "Inter, sans-serif",
          lineHeight: "1.5",
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
            color: "#3B82F6",
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
const OnlineStatus = () => {
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
        background: isOnline ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
        border: `1px solid ${isOnline ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
      }}
    >
      {isOnline ? (
        <Wifi size={15} color="#22c55e" />
      ) : (
        <WifiOff size={15} color="#ef4444" />
      )}
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: isOnline ? "#16a34a" : "#dc2626",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {isOnline ? "Connected" : "Offline"}
      </span>
    </div>
  );
};

/* ─── Quick Links ──────────────────────────────────────────────────────────── */
const QuickLinks = () => {
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
            color: "#475569",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "Inter, system-ui, sans-serif",
            transition: "all 0.15s ease",
            marginBottom: "2px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.color = "#0F172A";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#475569";
          }}
        >
          <span>{label}</span>
          <ChevronRight size={14} />
        </button>
      ))}
    </div>
  );
};

/* ─── Right Sidebar ─────────────────────────────────────────────────────────── */
const RightSidebar = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get("/announcements?limit=3");
        setAnnouncements(res.data?.data || []);
      } catch {
        // Silently fail — announcements are non-critical
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
      }}
    >
      {/* ── Announcements ── */}
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
              color: "#0F172A",
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
          /* Skeleton */
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: "80px",
                  borderRadius: "14px",
                  background:
                    "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : announcements.length > 0 ? (
          announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))
        ) : (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              background: "#f8fafc",
              borderRadius: "14px",
              border: "1px dashed #e2e8f0",
            }}
          >
            No announcements yet
          </div>
        )}
      </section>

      {/* ── Quick Links ── */}
      <section>
        <h3
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#0F172A",
            margin: "0 0 8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          🔗 Quick Links
        </h3>
        <QuickLinks />
      </section>

      {/* ── Status ── */}
      <section>
        <OnlineStatus />
      </section>

      {/* ── Footer ── */}
      <section style={{ marginTop: "auto" }}>
        <p
          style={{
            fontSize: "11px",
            color: "#cbd5e1",
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

      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </aside>
  );
};

export default RightSidebar;
