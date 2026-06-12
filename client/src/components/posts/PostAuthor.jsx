import { useNavigate } from "react-router-dom";
import { getAvatarUrl } from "../../utils/media";
import useTheme from "../../hooks/useTheme";

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
};

const PostAuthor = ({ author, createdAt }) => {
  const navigate = useNavigate();
  const { c } = useTheme();

  if (!author) return null;

  const letter = author.fullName?.charAt(0)?.toUpperCase() || "?";
  const avatarSrc = getAvatarUrl(author.avatarUrl);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "12px",
      }}
    >
      <div
        onClick={() => navigate(`/profile/${author.username}`)}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          overflow: "hidden",
          border: `2px solid ${c.border}`,
        }}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={author.fullName}
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
              fontSize: "15px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {letter}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          onClick={() => navigate(`/profile/${author.username}`)}
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: c.text,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {author.fullName || author.username}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              fontSize: "12px",
              color: c.textMuted,
              fontFamily: "Inter, sans-serif",
            }}
          >
            @{author.username}
          </span>
          <span style={{ fontSize: "12px", color: c.textFaint }}>·</span>
          <span
            style={{
              fontSize: "12px",
              color: c.textMuted,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {timeAgo(createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PostAuthor;
