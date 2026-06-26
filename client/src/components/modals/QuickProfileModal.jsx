import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, BadgeCheck, Shield, ArrowRight, Loader2 } from "lucide-react";
import { usersApi } from "../../api/endpoints/users.api";
import { getAvatarUrl } from "../../utils/media";
import useTheme from "../../hooks/useTheme";

const formatJoinDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
};

const QuickProfileModal = ({ username, isOpen, onClose }) => {
  const { c } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !username) return;

    setLoading(true);
    setError(null);
    setProfile(null);

    usersApi
      .getProfile(username)
      .then((res) => setProfile(res.data))
      .catch((err) =>
        setError(err?.response?.data?.message || "User not found"),
      )
      .finally(() => setLoading(false));
  }, [isOpen, username]);

  /* ESC to close */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleViewFull = () => {
    if (profile?.username) {
      navigate(`/profile/${profile.username}`);
      onClose();
    }
  };

  const letter = profile?.profile?.fullName?.charAt(0)?.toUpperCase() || "?";
  const avatarSrc = getAvatarUrl(profile?.profile?.avatarUrl);
  const isAdmin = profile?.role === "admin";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--backdrop)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "400px",
          background: c.bgCard,
          borderRadius: "20px",
          boxShadow: c.shadowLg,
          zIndex: 201,
          overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
          animation: "modalPop 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* ── Header gradient strip ── */}
        <div
          style={{
            height: "100px",
            background:
              "linear-gradient(135deg, #3B82F6 0%, #2563eb 50%, #8b5cf6 100%)",
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              border: "none",
              borderRadius: "50%",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "0 24px 24px" }}>
          {loading ? (
            /* ─── Loading state ─── */
            <div
              style={{
                textAlign: "center",
                paddingTop: "20px",
                paddingBottom: "30px",
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  background: c.bgSubtle,
                  border: `4px solid ${c.bgCard}`,
                  margin: "-60px auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: c.shadowMd,
                }}
              >
                <Loader2
                  size={36}
                  color={c.accent}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              </div>
              <p style={{ color: c.textMuted, fontSize: "13px", margin: 0 }}>
                Loading profile...
              </p>
            </div>
          ) : error ? (
            /* ─── Error state ─── */
            <div
              style={{
                textAlign: "center",
                paddingTop: "20px",
                paddingBottom: "30px",
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  background: c.bgSubtle,
                  border: `4px solid ${c.bgCard}`,
                  margin: "-60px auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "46px",
                  boxShadow: c.shadowMd,
                }}
              >
                😕
              </div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: c.text,
                  margin: "0 0 6px",
                }}
              >
                User Not Found
              </h3>
              <p style={{ fontSize: "13px", color: c.textMuted, margin: 0 }}>
                @{username} doesn't exist
              </p>
            </div>
          ) : (
            /* ─── Profile content ─── */
            <>
              {/* Avatar — FULL IMAGE VISIBLE (no cropping) */}
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3B82F6, #8b5cf6)",
                  border: `4px solid ${c.bgCard}`,
                  margin: "-60px auto 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  boxShadow: c.shadowMd,
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={profile.profile?.fullName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain" /* Show FULL image */,
                      objectPosition: "center",
                      display: "block",
                      background: "linear-gradient(135deg, #3B82F6, #8b5cf6)",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "48px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {letter}
                  </span>
                )}
              </div>

              {/* Name + badges */}
              <div
                style={{
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginBottom: "4px",
                }}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: c.text,
                    margin: 0,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {profile.profile?.fullName || profile.username}
                </h2>

                {profile.isVerified && (
                  <BadgeCheck
                    size={18}
                    color={c.accent}
                    fill={c.accent}
                    style={{ color: "#fff", flexShrink: 0 }}
                  />
                )}

                {isAdmin && (
                  <span
                    style={{
                      background: "linear-gradient(135deg, #3B82F6, #2563eb)",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "20px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      flexShrink: 0,
                    }}
                  >
                    <Shield size={8} fill="#fff" />
                    ADMIN
                  </span>
                )}
              </div>

              {/* Username */}
              <p
                style={{
                  textAlign: "center",
                  fontSize: "13px",
                  color: c.textTer,
                  margin: "0 0 14px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                @{profile.username}
              </p>

              {/* Bio */}
              {profile.profile?.bio && (
                <p
                  style={{
                    fontSize: "13px",
                    color: c.textSec,
                    margin: "0 0 16px",
                    lineHeight: 1.5,
                    textAlign: "center",
                    wordBreak: "break-word",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {profile.profile.bio}
                </p>
              )}

              {/* Stats */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                  padding: "14px 12px",
                  background: c.bgSubtle,
                  borderRadius: "12px",
                  marginBottom: "16px",
                  gap: "8px",
                }}
              >
                <Stat label="Posts" value={profile.stats?.posts || 0} c={c} />
                <Divider c={c} />
                <Stat
                  label="Notices"
                  value={profile.stats?.notices || 0}
                  c={c}
                />
                <Divider c={c} />
                <Stat
                  label="Joined"
                  value={formatJoinDate(profile.joinedAt)}
                  c={c}
                  isText
                />
              </div>

              {/* View Profile Button */}
              <button
                onClick={handleViewFull}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "linear-gradient(135deg, #3B82F6, #2563eb)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.92";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                View Full Profile
                <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes modalPop {
            0% {
              opacity  : 0;
              transform: translate(-50%, -50%) scale(0.9);
            }
            100% {
              opacity  : 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
};

/* ─── Sub-components ─── */

const Stat = ({ label, value, c, isText = false }) => (
  <div
    style={{
      textAlign: "center",
      flex: 1,
      minWidth: 0,
    }}
  >
    <p
      style={{
        fontSize: isText ? "13px" : "18px",
        fontWeight: 800,
        color: c.text,
        margin: 0,
        lineHeight: 1.1,
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </p>
    <p
      style={{
        fontSize: "10px",
        color: c.textMuted,
        margin: "4px 0 0",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {label}
    </p>
  </div>
);

const Divider = ({ c }) => (
  <div
    style={{
      width: "1px",
      height: "32px",
      background: c.borderStrong,
      flexShrink: 0,
    }}
  />
);

export default QuickProfileModal;
