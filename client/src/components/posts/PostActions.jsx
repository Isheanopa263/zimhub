import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import useAuthStore from "../../store/authStore";

const PostActions = ({
  post,
  isLiked,
  likeCount,
  commentCount,
  onLike,
  onComment,
  onDelete,
  likeLoading,
}) => {
  const { user } = useAuthStore();
  const [menu, setMenu] = useState(false);
  const [heartPop, setHeartPop] = useState(false);

  if (!post) return null;

  const isOwner = user?.id === post.author?.id;
  const isAdmin = user?.role === "admin";
  const canDelete = isOwner || isAdmin;

  const handleLikeClick = () => {
    if (likeLoading) return;
    // Heart pop animation
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 400);
    onLike?.();
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    const text = post.caption || "Check this out on ZimHub";

    if (navigator.share) {
      try {
        await navigator.share({ title: "ZimHub", text, url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {}
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "12px",
        paddingTop: "10px",
        borderTop: "1px solid #f8fafc",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {/* Like */}
        <button
          onClick={handleLikeClick}
          disabled={likeLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "none",
            border: "none",
            cursor: likeLoading ? "wait" : "pointer",
            padding: "7px 10px",
            borderRadius: "8px",
            transition: "all 0.15s ease",
            color: isLiked ? "#ef4444" : "#64748b",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <Heart
            size={18}
            fill={isLiked ? "#ef4444" : "none"}
            color={isLiked ? "#ef4444" : "#64748b"}
            strokeWidth={2}
            style={{
              transition: "transform 0.2s ease",
              transform: heartPop ? "scale(1.4)" : "scale(1)",
            }}
          />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              color: isLiked ? "#ef4444" : "#64748b",
            }}
          >
            {likeCount}
          </span>
        </button>

        {/* Comment */}
        <button
          onClick={onComment}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "7px 10px",
            borderRadius: "8px",
            color: "#64748b",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <MessageCircle size={18} color="#64748b" />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              color: "#64748b",
            }}
          >
            {commentCount}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "7px 10px",
            borderRadius: "8px",
            color: "#64748b",
            transition: "all 0.15s ease",
            display: "flex",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdf4")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <Share2 size={18} color="#64748b" />
        </button>
      </div>

      {/* Owner menu */}
      {canDelete && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenu(!menu)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              color: "#94a3b8",
              display: "flex",
            }}
          >
            <MoreHorizontal size={18} />
          </button>

          {menu && (
            <>
              <div
                onClick={() => setMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "4px",
                  background: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  border: "1px solid #f1f5f9",
                  padding: "4px",
                  minWidth: "150px",
                  zIndex: 50,
                }}
              >
                <button
                  onClick={() => {
                    setMenu(false);
                    onDelete?.();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "10px 12px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    borderRadius: "8px",
                    color: "#ef4444",
                    fontSize: "13px",
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
                  <Trash2 size={15} />
                  Delete Post
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostActions;
