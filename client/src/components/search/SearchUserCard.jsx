import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { getAvatarUrl } from "../../utils/media";
import useTheme from "../../hooks/useTheme";

const SearchUserCard = ({ user, compact = false }) => {
  const navigate = useNavigate();
  const { c } = useTheme();

  if (!user) return null;

  const letter = user.fullName?.charAt(0)?.toUpperCase() || "?";
  const avatarSrc = getAvatarUrl(user.avatarUrl);
  const isAdmin = user.role === "admin";

  return (
    <div
      onClick={() => navigate(`/profile/${user.username}`)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: compact ? "10px 12px" : "14px 16px",
        background: c.bgCard,
        borderRadius: "12px",
        border: `1px solid ${c.border}`,
        cursor: "pointer",
        marginBottom: "8px",
        transition: "all 0.15s ease",
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
      {/* Avatar */}
      <div
        style={{
          width: compact ? "38px" : "44px",
          height: compact ? "38px" : "44px",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
          border: `2px solid ${c.border}`,
        }}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={user.fullName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <span
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: compact ? "14px" : "16px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {letter}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <p
            style={{
              fontSize: compact ? "14px" : "15px",
              fontWeight: 700,
              color: c.text,
              margin: 0,
              fontFamily: "Inter, sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.fullName || user.username}
          </p>
          {isAdmin && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                background: c.accentLight,
                color: c.accent,
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "20px",
                flexShrink: 0,
              }}
            >
              <Shield size={8} fill={c.accent} />
              ADMIN
            </span>
          )}
        </div>

        <p
          style={{
            fontSize: "12px",
            color: c.textMuted,
            margin: "2px 0",
            fontFamily: "Inter, sans-serif",
          }}
        >
          @{user.username}
        </p>

        {user.bio && !compact && (
          <p
            style={{
              fontSize: "12px",
              color: c.textTer,
              margin: "4px 0 0",
              fontFamily: "Inter, sans-serif",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {user.bio}
          </p>
        )}
      </div>

      {/* Post count */}
      {!compact && (
        <div
          style={{
            textAlign: "right",
            flexShrink: 0,
            padding: "0 4px",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: c.text,
              margin: 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {user.postCount}
          </p>
          <p
            style={{
              fontSize: "10px",
              color: c.textMuted,
              margin: 0,
              fontFamily: "Inter, sans-serif",
              textTransform: "uppercase",
            }}
          >
            Posts
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchUserCard;
