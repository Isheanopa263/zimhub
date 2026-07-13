import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, Bell, User, ClipboardList } from "lucide-react";
import useTheme from "../../hooks/useTheme";

const navItems = [
  { to: "/feed", icon: Home, label: "Feed" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/notices", icon: ClipboardList, label: "Notices" },
  { to: "/notifications", icon: Bell, label: "Alerts", badge: true },
  { to: "/profile", icon: User, label: "Profile" },
];

const BottomNav = ({ unreadNotifications = 0 }) => {
  const { c } = useTheme();
  const location = useLocation();

  const handleNavClick = (e, to) => {
    const isCurrentPage = location.pathname === to;

    if (isCurrentPage) {
      e.preventDefault();

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });

      // For the immersive feed, scroll the snap container
      const snapContainer = document.querySelector(".hide-scrollbar");
      if (snapContainer) {
        snapContainer.scrollTo({ top: 0, behavior: "smooth" });
      }

      // Dispatch custom event so pages can handle refresh
      window.dispatchEvent(
        new CustomEvent("nav-tap-refresh", {
          detail: { page: to },
        }),
      );
    }
  };

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: c.bgCard,
        borderTop: `1px solid ${c.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
        zIndex: 50,
        boxShadow: c.shadowMd,
      }}
    >
      {navItems.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          style={{ textDecoration: "none", flex: 1 }}
          onClick={(e) => handleNavClick(e, to)}
        >
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
              <div
                style={{
                  position: "relative",
                  width: "42px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  background: isActive ? c.accentLight : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  color={isActive ? c.accent : c.textMuted}
                />
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
                      border: `2px solid ${c.bgCard}`,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </div>
                )}
              </div>

              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? c.accent : c.textMuted,
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
