import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Bell,
  User,
  ClipboardList,
  LogOut,
  Shield,
  Plus,
  Sun,
  Moon,
  Info,
  HelpCircle,
} from "lucide-react";

import useAuthStore from "../../store/authStore";
import useAuth from "../../hooks/useAuth";
import useUIStore from "../../store/uiStore";
import useTheme from "../../hooks/useTheme";
import { getAvatarUrl } from "../../utils/media";
import AboutModal from "../modals/AboutModal";

const navItems = [
  { to: "/feed", icon: Home, label: "Feed" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/notices", icon: ClipboardList, label: "Notice Board" },
  { to: "/notifications", icon: Bell, label: "Notifications", badge: true },
  { to: "/profile", icon: User, label: "My Profile" },
];

/* ─── Sidebar Nav Item ─────────────────────────────────────────── */
const SidebarItem = ({ to, icon: Icon, label, badge, unreadCount = 0, c }) => {
  const location = useLocation();

  const handleClick = (e) => {
    const isCurrentPage = location.pathname === to;

    if (isCurrentPage) {
      e.preventDefault();

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });

      // For the immersive feed
      const snapContainer = document.querySelector(".hide-scrollbar");
      if (snapContainer) {
        snapContainer.scrollTo({ top: 0, behavior: "smooth" });
      }

      // Dispatch custom event for page refresh
      window.dispatchEvent(
        new CustomEvent("nav-tap-refresh", {
          detail: { page: to },
        }),
      );
    }
  };

  return (
    <NavLink to={to} style={{ textDecoration: "none" }} onClick={handleClick}>
      {({ isActive }) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 14px",
            borderRadius: "14px",
            background: isActive ? c.accentLight : "transparent",
            color: isActive ? c.accent : c.textTer,
            fontWeight: isActive ? 700 : 500,
            fontSize: "15px",
            transition: "all 0.15s ease",
            cursor: "pointer",
            position: "relative",
            border: isActive
              ? `1px solid ${c.accent}30`
              : "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = c.bgHover;
              e.currentTarget.style.color = c.text;
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = c.textTer;
            }
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Icon size={20} style={{ strokeWidth: isActive ? 2.5 : 2 }} />

            {badge && unreadCount > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 700,
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  border: `2px solid ${c.bgCard}`,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </div>

          <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            {label}
          </span>

          {isActive && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "60%",
                background: c.accent,
                borderRadius: "0 3px 3px 0",
              }}
            />
          )}
        </div>
      )}
    </NavLink>
  );
};

/* ─── Avatar Component (MUST use useState — it's a component) ──── */
const Avatar = ({ src, letter, size = 38, c }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = src && !imgFailed;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #3B82F6, #8b5cf6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        border: `2px solid ${c.borderStrong}`,
      }}
    >
      {showImg ? (
        <img
          src={src}
          alt="Profile"
          onError={() => setImgFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <span
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: `${Math.floor(size * 0.38)}px`,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {letter}
        </span>
      )}
    </div>
  );
};

/* ─── Main Sidebar ─────────────────────────────────────────────── */
const Sidebar = ({ unreadNotifications = 0 }) => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { openCreatePost } = useUIStore();
  const { isDark, toggleTheme, c } = useTheme();
  const navigate = useNavigate();

  const [aboutOpen, setAboutOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const avatarSrc = getAvatarUrl(user?.profile?.avatar_url);
  const letter = user?.profile?.full_name?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      <aside
        style={{
          width: "260px",
          minWidth: "260px",
          height: "100vh",
          position: "sticky",
          top: 0,
          background: c.bgCard,
          borderRight: `1px solid ${c.border}`,
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflowY: "auto",
          overflowX: "hidden",
          zIndex: 40,
        }}
      >
        {/* ── Logo ── */}
        <div
          style={{
            padding: "24px 20px 16px",
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #3B82F6, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "16px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Z
              </span>
            </div>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 900,
                fontFamily: "Inter, sans-serif",
                letterSpacing: "-0.5px",
              }}
            >
              <span style={{ color: c.text }}>Zim</span>
              <span style={{ color: c.accentText }}>Hub</span>
            </span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav
          style={{
            flex: 1,
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {navItems.map((item) => (
            <SidebarItem
              key={item.to}
              {...item}
              unreadCount={item.badge ? unreadNotifications : 0}
              c={c}
            />
          ))}

          {isAdmin && (
            <>
              <div
                style={{
                  height: "1px",
                  background: c.border,
                  margin: "8px 0",
                }}
              />
              <SidebarItem
                to="/admin"
                icon={Shield}
                label="Admin Panel"
                c={c}
              />
            </>
          )}

          <div
            style={{
              height: "1px",
              background: c.border,
              margin: "8px 0",
            }}
          />

          {/* Create Post Button */}
          {/* Create Post Button */}
          <button
            onClick={() => {
              // If not on feed, navigate there first
              if (window.location.pathname !== "/feed") {
                navigate("/feed");
                // Wait a tick for navigation to complete, then open modal
                setTimeout(() => openCreatePost(), 100);
              } else {
                openCreatePost();
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 14px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #3B82F6 0%, #2563eb 100%)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "15px",
              border: "none",
              cursor: "pointer",
              width: "100%",
              fontFamily: "Inter, system-ui, sans-serif",
              boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>Create Post</span>
          </button>
        </nav>

        {/* ── User Profile Footer ── */}
        <div
          style={{
            padding: "12px",
            borderTop: `1px solid ${c.border}`,
          }}
        >
          {/* Profile row */}
          <div
            onClick={() => navigate("/profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "background 0.15s ease",
              marginBottom: "4px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = c.bgHover)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Avatar src={avatarSrc} letter={letter} size={38} c={c} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: c.text,
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.profile?.full_name || "User"}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: c.textMuted,
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                @{user?.username || "username"}
              </p>
            </div>

            {isAdmin && (
              <div
                style={{
                  background: c.accentLight,
                  color: c.accent,
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "20px",
                  flexShrink: 0,
                  fontFamily: "Inter, sans-serif",
                  border: `1px solid ${c.accent}30`,
                }}
              >
                ADMIN
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              padding: "9px 10px",
              borderRadius: "10px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              width: "100%",
              fontFamily: "Inter, system-ui, sans-serif",
              transition: "all 0.15s ease",
              marginBottom: "2px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = c.bgHover)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {isDark ? (
                <Moon size={16} color={c.accent} fill={c.accent} />
              ) : (
                <Sun size={16} color={c.warning} />
              )}
              <span
                style={{
                  fontSize: "14px",
                  color: c.text,
                  fontWeight: 500,
                }}
              >
                {isDark ? "Dark Mode" : "Light Mode"}
              </span>
            </div>

            {/* Toggle switch */}
            <div
              style={{
                width: "32px",
                height: "18px",
                borderRadius: "20px",
                background: isDark ? c.accent : "#cbd5e1",
                position: "relative",
                flexShrink: 0,
                transition: "background 0.2s ease",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: isDark ? "16px" : "2px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          </button>

          {/* Support */}
          <button
            onClick={() => navigate("/support")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 10px",
              borderRadius: "10px",
              background: "transparent",
              color: c.textMuted,
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              width: "100%",
              fontFamily: "Inter, system-ui, sans-serif",
              transition: "all 0.15s ease",
              marginBottom: "2px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = c.bgHover;
              e.currentTarget.style.color = c.success;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = c.textMuted;
            }}
          >
            <HelpCircle size={16} />
            <span>Help & Support</span>
          </button>

          {/* About */}
          <button
            onClick={() => setAboutOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 10px",
              borderRadius: "10px",
              background: "transparent",
              color: c.textMuted,
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              width: "100%",
              fontFamily: "Inter, system-ui, sans-serif",
              transition: "all 0.15s ease",
              marginBottom: "2px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = c.bgHover;
              e.currentTarget.style.color = c.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = c.textMuted;
            }}
          >
            <Info size={16} />
            <span>About ZimHub</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 10px",
              borderRadius: "10px",
              background: "transparent",
              color: c.textMuted,
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              width: "100%",
              fontFamily: "Inter, system-ui, sans-serif",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = c.dangerLight;
              e.currentTarget.style.color = c.danger;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = c.textMuted;
            }}
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
};

export default Sidebar;
