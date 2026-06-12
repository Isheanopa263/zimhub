import { NavLink } from "react-router-dom";
import { Home, Search, Bell, User, ClipboardList } from "lucide-react";
import useUIStore from "../../store/uiStore";

const navItems = [
  { to: "/feed", icon: Home, label: "Feed" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/notices", icon: ClipboardList, label: "Notices" },
  { to: "/notifications", icon: Bell, label: "Alerts", badge: true },
  { to: "/profile", icon: User, label: "Profile" },
];

const BottomNav = ({ unreadNotifications = 0 }) => {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#ffffff",
        borderTop: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
        zIndex: 50,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}
    >
      {navItems.map(({ to, icon: Icon, label, badge }) => (
        <NavLink key={to} to={to} style={{ textDecoration: "none", flex: 1 }}>
          {({ isActive }) => (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                padding: "4px 8px",
                position: "relative",
              }}
            >
              {/* Icon container */}
              <div
                style={{
                  position: "relative",
                  width: "42px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  color={isActive ? "#3B82F6" : "#94a3b8"}
                />
                {/* Badge */}
                {badge && unreadNotifications > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "2px",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 700,
                      minWidth: "16px",
                      height: "16px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 3px",
                      border: "2px solid #ffffff",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#3B82F6" : "#94a3b8",
                  fontFamily: "Inter, system-ui, sans-serif",
                  letterSpacing: "0.2px",
                }}
              >
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
