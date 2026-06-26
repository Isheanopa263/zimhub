import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Plus,
  LogOut,
  User,
  Shield,
  Sun,
  Moon,
  Info,
  HelpCircle,
} from "lucide-react";

import useUIStore from "../../store/uiStore";
import useAuthStore from "../../store/authStore";
import useAuth from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";
import { getAvatarUrl } from "../../utils/media";
import AboutModal from "../modals/AboutModal";

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
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { isDark, toggleTheme, c } = useTheme();

  const title = routeTitles[location.pathname] || "ZimHub";
  const isHome = location.pathname === "/feed";
  const showBack = !Object.keys(routeTitles).some((p) =>
    location.pathname.startsWith(p),
  );

  const isAdmin = user?.role === "admin";
  const avatarSrc = getAvatarUrl(user?.profile?.avatar_url);
  const letter = user?.profile?.full_name?.charAt(0)?.toUpperCase() || "U";

  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleNav = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleAbout = () => {
    setMenuOpen(false);
    setAboutOpen(true);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: isDark
            ? "rgba(19, 26, 43, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${c.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 40,
          boxShadow: c.shadowSm,
        }}
      >
        {/* Left side */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: 1,
            minWidth: 0,
          }}
        >
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              style={{
                background: c.bgHover,
                border: "none",
                borderRadius: "10px",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: c.text,
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={18} />
            </button>
          )}

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
                <span style={{ color: c.text }}>Zim</span>
                <span style={{ color: c.accentText }}>Hub</span>
              </span>
            </div>
          ) : (
            <h1
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: c.text,
                margin: 0,
                fontFamily: "Inter, sans-serif",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </h1>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

          <button
            onClick={() => navigate("/notifications")}
            style={{
              background: c.bgSubtle,
              border: "none",
              borderRadius: "10px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: c.textTer,
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
                  border: `2px solid ${c.bgCard}`,
                }}
              />
            )}
          </button>

          {/* Avatar Menu */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: "linear-gradient(135deg, #3B82F6, #8b5cf6)",
                border: `2px solid ${c.bgCard}`,
                borderRadius: "50%",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                padding: 0,
                boxShadow: `0 0 0 2px ${menuOpen ? c.accent : c.borderStrong}`,
                transition: "box-shadow 0.15s ease",
              }}
            >
              <AvatarImage src={avatarSrc} letter={letter} />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: "240px",
                  background: c.bgCard,
                  borderRadius: "14px",
                  border: `1px solid ${c.border}`,
                  boxShadow: c.shadowLg,
                  padding: "6px",
                  zIndex: 100,
                  animation: "menuFadeIn 0.15s ease",
                }}
              >
                {/* User Info */}
                <div
                  style={{
                    padding: "12px",
                    borderBottom: `1px solid ${c.border}`,
                    marginBottom: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3B82F6, #8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <AvatarImage
                      src={avatarSrc}
                      letter={letter}
                      fontSize="17px"
                    />
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
                      {user?.profile?.full_name || "User"}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: c.textMuted,
                        margin: "2px 0 0",
                        fontFamily: "Inter, sans-serif",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      @{user?.username || "username"}
                    </p>
                  </div>
                </div>

                <MenuItem
                  icon={User}
                  label="My Profile"
                  onClick={() => handleNav("/profile")}
                  c={c}
                />

                <MenuItem
                  icon={HelpCircle}
                  label="Help & Support"
                  color={c.success}
                  onClick={() => handleNav("/support")}
                  c={c}
                />

                {isAdmin && (
                  <MenuItem
                    icon={Shield}
                    label="Admin Panel"
                    color={c.accent}
                    onClick={() => handleNav("/admin")}
                    c={c}
                  />
                )}
                <div
                  style={{
                    height: "1px",
                    background: c.border,
                    margin: "6px 8px",
                  }}
                />

                <ThemeToggleItem
                  isDark={isDark}
                  onToggle={handleThemeToggle}
                  c={c}
                />

                <div
                  style={{
                    height: "1px",
                    background: c.border,
                    margin: "6px 8px",
                  }}
                />

                <MenuItem
                  icon={Info}
                  label="About ZimHub"
                  color={c.accent}
                  onClick={handleAbout}
                  c={c}
                />

                <div
                  style={{
                    height: "1px",
                    background: c.border,
                    margin: "6px 8px",
                  }}
                />

                <MenuItem
                  icon={LogOut}
                  label="Sign Out"
                  color={c.danger}
                  onClick={handleLogout}
                  c={c}
                />
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes menuFadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </header>

      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
};

const AvatarImage = ({ src, letter, fontSize = "14px" }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = src && !imgFailed;

  if (showImg) {
    return (
      <img
        src={src}
        alt="Avatar"
        onError={() => setImgFailed(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }

  return (
    <span
      style={{
        color: "#fff",
        fontWeight: 700,
        fontSize: fontSize,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {letter}
    </span>
  );
};

const MenuItem = ({ icon: Icon, label, color, onClick, c }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      padding: "10px 12px",
      border: "none",
      background: "transparent",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
      color: color || c.text,
      fontFamily: "Inter, sans-serif",
      textAlign: "left",
      transition: "background 0.1s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background =
        color === c.danger ? c.dangerLight : c.bgHover;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
    }}
  >
    <Icon size={15} strokeWidth={2} />
    {label}
  </button>
);

const ThemeToggleItem = ({ isDark, onToggle, c }) => (
  <button
    onClick={onToggle}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      width: "100%",
      padding: "10px 12px",
      border: "none",
      background: "transparent",
      borderRadius: "10px",
      cursor: "pointer",
      fontFamily: "Inter, sans-serif",
      transition: "background 0.1s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = c.bgHover;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {isDark ? (
        <Moon size={15} color={c.accent} strokeWidth={2} fill={c.accent} />
      ) : (
        <Sun size={15} color={c.warning} strokeWidth={2} />
      )}
      <span
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: c.text,
        }}
      >
        {isDark ? "Dark Mode" : "Light Mode"}
      </span>
    </div>

    <div
      style={{
        width: "36px",
        height: "20px",
        borderRadius: "20px",
        background: isDark ? c.accent : "#cbd5e1",
        position: "relative",
        transition: "background 0.2s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "2px",
          left: isDark ? "18px" : "2px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  </button>
);

export default Header;
