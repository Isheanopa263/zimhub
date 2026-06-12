import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell, Plus } from "lucide-react";
import useUIStore from "../../store/uiStore";

/* Route title map */
const routeTitles = {
  "/feed": "ZimHub",
  "/search": "Search",
  "/notices": "Notice Board",
  "/notifications": "Notifications",
  "/profile": "My Profile",
  "/admin": "Admin Panel",
};

const Header = ({ unreadNotifications = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openCreatePost } = useUIStore();

  const title = routeTitles[location.pathname] || "ZimHub";
  const isHome = location.pathname === "/feed";
  const showBack = !Object.keys(routeTitles).includes(location.pathname);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        left: 0,
        right: 0,
        height: "60px",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 40,
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Left side */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "10px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#0F172A",
            }}
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}

        {/* Logo or Title */}
        {isHome ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #3B82F6, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "13px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Z
              </span>
            </div>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 900,
                fontFamily: "Inter, sans-serif",
                letterSpacing: "-0.5px",
              }}
            >
              <span style={{ color: "#0F172A" }}>Zim</span>
              <span style={{ color: "#3B82F6" }}>Hub</span>
            </span>
          </div>
        ) : (
          <h1
            style={{
              fontSize: "17px",
              fontWeight: 800,
              color: "#0F172A",
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {title}
          </h1>
        )}
      </div>

      {/* Right side actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Create post (only on feed) */}
        {isHome && (
          <button
            onClick={openCreatePost}
            style={{
              background: "linear-gradient(135deg, #3B82F6, #2563eb)",
              border: "none",
              borderRadius: "10px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        )}

        {/* Notifications bell */}
        <button
          onClick={() => navigate("/notifications")}
          style={{
            background: "#f8fafc",
            border: "none",
            borderRadius: "10px",
            width: "34px",
            height: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#64748b",
            position: "relative",
          }}
        >
          <Bell size={18} strokeWidth={2} />
          {unreadNotifications > 0 && (
            <div
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "8px",
                height: "8px",
                background: "#ef4444",
                borderRadius: "50%",
                border: "2px solid #ffffff",
              }}
            />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
