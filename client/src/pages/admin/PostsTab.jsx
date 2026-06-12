import { useEffect, useState } from "react";
import { Trash2, Heart, MessageCircle, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

import { adminApi } from "../../api/endpoints/admin.api";
import useTheme from "../../hooks/useTheme";

const PostsTab = () => {
  const { c } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPosts({ includeDeleted, limit: 50 });
      setPosts(response.data || []);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [includeDeleted]);

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete this ${post.type} post?`)) return;
    try {
      await adminApi.deletePost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "12px" }}>
        <button
          onClick={() => setIncludeDeleted(!includeDeleted)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "20px",
            border: "none",
            cursor: "pointer",
            background: includeDeleted ? c.dangerLight : c.bgHover,
            color: includeDeleted ? c.danger : c.textTer,
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {includeDeleted ? <EyeOff size={13} /> : <Eye size={13} />}
          {includeDeleted ? "Hiding Deleted" : "Showing Active Only"}
        </button>
      </div>

      {loading ? (
        <Loading c={c} />
      ) : posts.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: c.bgCard,
            borderRadius: "14px",
            border: `1px solid ${c.border}`,
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>📝</div>
          <p style={{ color: c.textTer, fontSize: "14px", margin: 0 }}>
            No posts found
          </p>
        </div>
      ) : (
        <div
          style={{
            background: c.bgCard,
            borderRadius: "14px",
            border: `1px solid ${c.border}`,
            overflow: "hidden",
          }}
        >
          {posts.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              c={c}
              onDelete={() => handleDelete(post)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PostRow = ({ post, onDelete, c }) => {
  const TYPE_CONFIG = {
    image: { label: "Photo", color: c.accent, bg: c.accentLight },
    video: { label: "Video", color: c.danger, bg: c.dangerLight },
    text: { label: "Text", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    link: { label: "Link", color: c.success, bg: c.successLight },
  };

  const badge = TYPE_CONFIG[post.type] || TYPE_CONFIG.text;

  const preview =
    post.preview.text ||
    post.caption ||
    post.preview.linkTitle ||
    `[${badge.label}]`;

  return (
    <div
      style={{
        padding: "14px",
        borderBottom: `1px solid ${c.border}`,
        display: "flex",
        gap: "12px",
        background: post.isDeleted ? c.dangerLight : c.bgCard,
      }}
    >
      <div
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "10px",
          flexShrink: 0,
          background: post.preview.image
            ? `url(${post.preview.image}) center/cover`
            : badge.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {!post.preview.image && (
          <span style={{ fontSize: "22px" }}>
            {post.type === "video"
              ? "🎬"
              : post.type === "text"
                ? "✍️"
                : post.type === "link"
                  ? "🔗"
                  : "🖼️"}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              background: badge.bg,
              color: badge.color,
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: "6px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {badge.label}
          </span>
          {post.isDeleted && (
            <span
              style={{
                background: c.dangerLight,
                color: c.danger,
                fontSize: "9px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "6px",
              }}
            >
              DELETED
            </span>
          )}
          <span
            style={{
              fontSize: "11px",
              color: c.textMuted,
              fontFamily: "Inter, sans-serif",
            }}
          >
            by @{post.author.username}
          </span>
        </div>

        <p
          style={{
            fontSize: "13px",
            color: c.text,
            margin: "0 0 6px",
            fontFamily: "Inter, sans-serif",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {preview}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "11px",
              color: c.textTer,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Heart size={11} /> {post.stats.likes}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "11px",
              color: c.textTer,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <MessageCircle size={11} /> {post.stats.comments}
          </span>
          <span
            style={{
              fontSize: "11px",
              color: c.textMuted,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {new Date(post.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </div>

      {!post.isDeleted && (
        <button
          onClick={onDelete}
          style={{
            background: c.dangerLight,
            border: "none",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: c.danger,
            flexShrink: 0,
            alignSelf: "flex-start",
          }}
          title="Delete post"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

const Loading = ({ c }) => (
  <div style={{ padding: "40px", textAlign: "center" }}>
    <div
      style={{
        width: "28px",
        height: "28px",
        border: `3px solid ${c.border}`,
        borderTop: `3px solid ${c.accent}`,
        borderRadius: "50%",
        margin: "0 auto",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <style>{`@keyframes spin { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

export default PostsTab;
