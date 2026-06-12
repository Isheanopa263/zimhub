import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Bell,
  User,
  ClipboardList,
  LogOut,
  Shield,
  Plus,
  Settings,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import useAuth from "../../hooks/useAuth";
import useUIStore from "../../store/uiStore";

/* ─── Nav Items Config ─────────────────────────────────────────────────────── */
const navItems = [
  { to: "/feed", icon: Home, label: "Feed" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/notices", icon: ClipboardList, label: "Notice Board" },
  { to: "/notifications", icon: Bell, label: "Notifications", badge: true },
  { to: "/profile", icon: User, label: "My Profile" },
];

/* ─── Sidebar NavLink Item ─────────────────────────────────────────────────── */
const SidebarItem = ({ to, icon: Icon, label, badge, unreadCount = 0 }) => {
  return (
    <NavLink to={to} style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 14px",
            borderRadius: "14px",
            background: isActive
              ? "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.1) 100%)"
              : "transparent",
            color: isActive ? "#3B82F6" : "#64748b",
            fontWeight: isActive ? "700" : "500",
            fontSize: "15px",
            transition: "all 0.15s ease",
            cursor: "pointer",
            position: "relative",
            border: isActive
              ? "1px solid rgba(59,130,246,0.2)"
              : "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#0F172A";
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#64748b";
            }
          }}
        >
          {/* Icon */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Icon
              size={20}
              style={{
                strokeWidth: isActive ? 2.5 : 2,
              }}
            />
            {/* Notification badge */}
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
                  border: "2px solid #ffffff",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </div>

          {/* Label */}
          <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            {label}
          </span>

          {/* Active indicator bar */}
          {isActive && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "60%",
                background: "#3B82F6",
                borderRadius: "0 3px 3px 0",
              }}
            />
          )}
        </div>
      )}
    </NavLink>
  );
};

/* ─── Main Sidebar ─────────────────────────────────────────────────────────── */
const Sidebar = ({ unreadNotifications = 0 }) => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { openCreatePost } = useUIStore();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  return (
    <aside
      style={{
        width: "260px",
        minWidth: "260px",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#ffffff",
        borderRight: "1px solid #f1f5f9",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        overflowY: "auto",
        overflowX: "hidden",
        zIndex: 40,
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          padding: "24px 20px 16px",
          borderBottom: "1px solid #f8fafc",
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
            <span style={{ color: "#0F172A" }}>Zim</span>
            <span style={{ color: "#3B82F6" }}>Hub</span>
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
          />
        ))}

        {/* Admin Panel Link */}
        {isAdmin && (
          <>
            <div
              style={{
                height: "1px",
                background: "#f1f5f9",
                margin: "8px 0",
              }}
            />
            <SidebarItem to="/admin" icon={Shield} label="Admin Panel" />
          </>
        )}

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "#f1f5f9",
            margin: "8px 0",
          }}
        />

        {/* Create Post Button */}
        <button
          onClick={openCreatePost}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 14px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #3B82F6 0%, #2563eb 100%)",
            color: "#ffffff",
            fontWeight: "700",
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
          borderTop: "1px solid #f1f5f9",
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
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          {/* Avatar */}
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3B82F6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
              border: "2px solid #e2e8f0",
            }}
          >
            {user?.profile?.avatar_url ? (
              <img
                src={user.profile.avatar_url}
                alt={user.profile.full_name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {user?.profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>

          {/* Name & username */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#0F172A",
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
                color: "#94a3b8",
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

          {/* Admin badge */}
          {isAdmin && (
            <div
              style={{
                background: "rgba(59,130,246,0.1)",
                color: "#3B82F6",
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "20px",
                flexShrink: 0,
                fontFamily: "Inter, sans-serif",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              ADMIN
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 10px",
            borderRadius: "10px",
            background: "transparent",
            color: "#94a3b8",
            fontSize: "14px",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            width: "100%",
            fontFamily: "Inter, system-ui, sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fef2f2";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#94a3b8";
          }}
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
