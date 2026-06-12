import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, MoreHorizontal } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { getAvatarUrl } from "../../utils/media";

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
};

const ReplyItem = ({ reply, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!reply?.author) return null;

  const isOwner = user?.id === reply.author.id;
  const isAdmin = user?.role === "admin";
  const canDelete = isOwner || isAdmin;
  const letter = reply.author.fullName?.charAt(0)?.toUpperCase() || "?";
  const avatarSrc = getAvatarUrl(reply.author.avatarUrl);

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        padding: "8px 0",
        borderBottom: "1px solid #f8fafc",
      }}
    >
      {/* Small avatar */}
      <div
        onClick={() => navigate(`/profile/${reply.author.username}`)}
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={reply.author.fullName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "11px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {letter}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "12px",
            padding: "8px 10px",
            position: "relative",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "2px",
            }}
          >
            <span
              onClick={() => navigate(`/profile/${reply.author.username}`)}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#0F172A",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {reply.author.fullName || reply.author.username}
            </span>

            {canDelete && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    borderRadius: "6px",
                    color: "#94a3b8",
                    display: "flex",
                  }}
                >
                  <MoreHorizontal size={12} />
                </button>

                {menuOpen && (
                  <>
                    <div
                      onClick={() => setMenuOpen(false)}
                      style={{ position: "fixed", inset: 0, zIndex: 40 }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "100%",
                        marginTop: "4px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                        border: "1px solid #f1f5f9",
                        padding: "4px",
                        zIndex: 50,
                        minWidth: "120px",
                      }}
                    >
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete?.(reply.id);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          width: "100%",
                          padding: "8px 10px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          borderRadius: "6px",
                          color: "#ef4444",
                          fontSize: "12px",
                          fontWeight: 600,
                          fontFamily: "Inter, sans-serif",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fef2f2")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Text */}
          <p
            style={{
              fontSize: "13px",
              color: "#0F172A",
              margin: 0,
              lineHeight: 1.45,
              fontFamily: "Inter, sans-serif",
              wordBreak: "break-word",
            }}
          >
            {reply.content}
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "3px",
            paddingLeft: "10px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              fontFamily: "Inter, sans-serif",
            }}
          >
            @{reply.author.username}
          </span>
          <span style={{ fontSize: "10px", color: "#cbd5e1" }}>·</span>
          <span
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {timeAgo(reply.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReplyItem;
