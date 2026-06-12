import { Calendar, Edit2, Shield, BadgeCheck } from "lucide-react";
import { getAvatarUrl } from "../../utils/media";
import useTheme from "../../hooks/useTheme";

const formatJoinDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
};

const ProfileHeader = ({ profile, onEditClick }) => {
  const { c, isDark } = useTheme();

  if (!profile) return null;

  const letter = profile.profile?.fullName?.charAt(0)?.toUpperCase() || "?";
  const avatarSrc = getAvatarUrl(profile.profile?.avatarUrl);
  const isAdmin = profile.role === "admin";

  return (
    <div
      style={{
        background: c.bgCard,
        borderRadius: "16px",
        border: `1px solid ${c.border}`,
        padding: "20px 18px",
        marginBottom: "16px",
        boxShadow: c.shadowSm,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "70px",
          background:
            "linear-gradient(135deg, #3B82F6 0%, #2563eb 50%, #8b5cf6 100%)",
          opacity: isDark ? 0.15 : 0.08,
        }}
      />

      <div style={{ position: "relative" }}>
        {/* Avatar + Edit btn row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: `4px solid ${c.bgCard}`,
              boxShadow: c.shadowMd,
              flexShrink: 0,
            }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={profile.profile?.fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <span
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "32px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {letter}
              </span>
            )}
          </div>

          {profile.isOwnProfile && (
            <button
              onClick={onEditClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: c.bgCard,
                border: `2px solid ${c.borderStrong}`,
                borderRadius: "12px",
                cursor: "pointer",
                color: c.text,
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = c.accent;
                e.currentTarget.style.color = c.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = c.borderStrong;
                e.currentTarget.style.color = c.text;
              }}
            >
              <Edit2 size={13} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Name + badges */}
        <div
          style={{
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {profile.profile?.fullName || profile.username}
          </h1>

          {profile.isVerified && (
            <BadgeCheck
              size={20}
              color={c.accent}
              fill={c.accent}
              style={{ color: "#fff" }}
            />
          )}

          {isAdmin && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                background: "linear-gradient(135deg,#3B82F6,#2563eb)",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "20px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <Shield size={9} fill="#fff" />
              ADMIN
            </span>
          )}
        </div>

        {/* Username */}
        <p
          style={{
            fontSize: "14px",
            color: c.textTer,
            margin: "0 0 12px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          @{profile.username}
        </p>

        {/* Bio */}
        {profile.profile?.bio && (
          <p
            style={{
              fontSize: "14px",
              color: c.textSec,
              margin: "0 0 14px",
              lineHeight: 1.55,
              fontFamily: "Inter, sans-serif",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {profile.profile.bio}
          </p>
        )}

        {/* Join date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            color: c.textMuted,
            fontSize: "12px",
            marginBottom: "16px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <Calendar size={12} />
          Joined {formatJoinDate(profile.joinedAt)}
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            paddingTop: "14px",
            borderTop: `1px solid ${c.border}`,
          }}
        >
          <Stat label="Posts" value={profile.stats?.posts || 0} c={c} />
          <Stat label="Notices" value={profile.stats?.notices || 0} c={c} />
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, c }) => (
  <div>
    <p
      style={{
        fontSize: "18px",
        fontWeight: 800,
        color: c.text,
        margin: 0,
        lineHeight: 1.1,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {value}
    </p>
    <p
      style={{
        fontSize: "11px",
        color: c.textMuted,
        margin: "2px 0 0",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {label}
    </p>
  </div>
);

export default ProfileHeader;
