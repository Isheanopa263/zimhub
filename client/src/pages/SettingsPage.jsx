import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Lock,
  Shield,
  LogOut,
  Trash2,
  ChevronRight,
  AlertTriangle,
  Mail,
  Info,
  HelpCircle,
  FileText,
} from "lucide-react";

import useAuthStore from "../store/authStore";
import useAuth from "../hooks/useAuth";
import useTheme from "../hooks/useTheme";

import DeleteAccountModal from "../components/modals/DeleteAccountModal";
import AboutModal from "../components/modals/AboutModal";
import ChangePasswordModal from "../components/modals/ChangePasswordModal";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { c } = useTheme();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
    }
  };

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        paddingBottom: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "16px 0 20px",
        }}
      >
        <button
          onClick={() => navigate("/profile")}
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
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
            }}
          >
            ⚙️ Account Settings
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: c.textTer,
              margin: "2px 0 0",
            }}
          >
            Manage your account preferences
          </p>
        </div>
      </div>

      {/* Account Info */}
      <Section c={c} title="Account">
        <InfoCard
          c={c}
          icon={User}
          label="Username"
          value={`@${user?.username}`}
        />
        <InfoCard c={c} icon={Mail} label="Email" value={user?.email} />
      </Section>

      {/* Security */}
      <Section c={c} title="Security">
        <SettingButton
          c={c}
          icon={Lock}
          iconColor={c.accent}
          iconBg={c.accentLight}
          title="Change Password"
          description="Update your account password"
          onClick={() => setPasswordOpen(true)}
        />

        <SettingButton
          c={c}
          icon={HelpCircle}
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.12)"
          title="Help & Support"
          description="Get help or send suggestions"
          onClick={() => navigate("/support")}
        />
      </Section>

      {/* Admin */}
      {isAdmin && (
        <Section c={c} title="Administration">
          <SettingButton
            c={c}
            icon={Shield}
            iconColor={c.accent}
            iconBg={c.accentLight}
            title="Admin Panel"
            description="Manage users, posts and notices"
            onClick={() => navigate("/admin")}
          />
        </Section>
      )}

      {/* About */}
      <Section c={c} title="App">
        <SettingButton
          c={c}
          icon={Info}
          iconColor="#8b5cf6"
          iconBg="rgba(139,92,246,0.12)"
          title="About ZimHub"
          description="App info, version & developer"
          onClick={() => setAboutOpen(true)}
        />
        <SettingButton
          c={c}
          icon={FileText}
          iconColor={c.success}
          iconBg={c.successLight}
          title="Privacy Policy"
          description="How we handle your data"
          onClick={() => navigate("/privacy-policy")}
        />
      </Section>

      {/* Sign Out */}
      <Section c={c} title="Session">
        <SettingButton
          c={c}
          icon={LogOut}
          iconColor={c.warning}
          iconBg={c.warningLight}
          title="Sign Out"
          description="Log out of your account"
          onClick={handleLogout}
        />
      </Section>

      {/* Danger Zone */}
      {!isAdmin && (
        <div style={{ marginTop: "32px" }}>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: c.danger,
              margin: "0 0 12px",
              paddingLeft: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <AlertTriangle size={12} />
            Danger Zone
          </h3>

          <div
            style={{
              background: c.dangerLight,
              border: `1px solid ${c.danger}40`,
              borderRadius: "14px",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: `${c.danger}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Trash2 size={16} color={c.danger} />
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: c.text,
                    margin: "0 0 4px",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Delete Account
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: c.textTer,
                    margin: 0,
                    lineHeight: 1.5,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Permanently delete your account, all posts, notices, comments
                  and media. This cannot be undone.
                </p>
              </div>
            </div>

            <button
              onClick={() => setDeleteOpen(true)}
              style={{
                width: "100%",
                padding: "11px",
                background: c.danger,
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Delete My Account
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <DeleteAccountModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        userEmail={user?.email}
      />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ChangePasswordModal
        isOpen={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </div>
  );
};

/* ─── Sub Components ────────────────────────────────────────── */

const Section = ({ title, children, c }) => (
  <div style={{ marginBottom: "24px" }}>
    <h3
      style={{
        fontSize: "12px",
        fontWeight: 700,
        color: c.textMuted,
        margin: "0 0 10px",
        paddingLeft: "4px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {title}
    </h3>
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {children}
    </div>
  </div>
);

const InfoCard = ({ icon: Icon, label, value, c }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 14px",
      background: c.bgCard,
      borderRadius: "12px",
      border: `1px solid ${c.border}`,
    }}
  >
    <div
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: c.bgSubtle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={15} color={c.textTer} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p
        style={{
          fontSize: "11px",
          color: c.textMuted,
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontWeight: 600,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "14px",
          color: c.text,
          margin: "2px 0 0",
          fontWeight: 600,
          fontFamily: "Inter, sans-serif",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </p>
    </div>
  </div>
);

const SettingButton = ({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  onClick,
  c,
}) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      width: "100%",
      background: c.bgCard,
      border: `1px solid ${c.border}`,
      borderRadius: "12px",
      padding: "12px 14px",
      cursor: "pointer",
      fontFamily: "Inter, sans-serif",
      transition: "all 0.15s ease",
      textAlign: "left",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = c.bgHover;
      e.currentTarget.style.borderColor = c.borderStrong;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = c.bgCard;
      e.currentTarget.style.borderColor = c.border;
    }}
  >
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        background: iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={16} color={iconColor} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: c.text,
          margin: 0,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: "12px",
          color: c.textTer,
          margin: "2px 0 0",
        }}
      >
        {description}
      </p>
    </div>
    <ChevronRight size={16} color={c.textMuted} />
  </button>
);

export default SettingsPage;
