import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Hash, Loader2, ArrowRight } from "lucide-react";
import { searchApi } from "../../api/endpoints/search.api";
import useTheme from "../../hooks/useTheme";

const HashtagModal = ({ tag, isOpen, onClose }) => {
  const { c } = useTheme();
  const navigate = useNavigate();
  const [results, setResults] = useState({ posts: [], counts: { posts: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !tag) return;

    setLoading(true);
    setResults({ posts: [], counts: { posts: 0 } });

    searchApi
      .posts(tag, { page: 1, limit: 5 })
      .then((res) => {
        setResults({
          posts: res.data || [],
          counts: { posts: res.meta?.total || 0 },
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, tag]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleViewAll = () => {
    navigate(`/search?q=${encodeURIComponent(tag)}&tab=posts`);
    onClose();
  };

  return (
    <>
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

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "440px",
          maxHeight: "85vh",
          background: c.bgCard,
          borderRadius: "20px",
          boxShadow: c.shadowLg,
          zIndex: 201,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, system-ui, sans-serif",
          animation: "modalPop 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
              }}
            >
              <Hash size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 800,
                  color: c.text,
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                #{tag}
              </h2>
              <p
                style={{
                  fontSize: "11px",
                  color: c.textTer,
                  margin: "2px 0 0",
                }}
              >
                {loading
                  ? "Searching..."
                  : `${results.counts.posts} ${results.counts.posts === 1 ? "post" : "posts"}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: c.bgHover,
              border: "none",
              borderRadius: "10px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: c.textTer,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Loader2
                size={28}
                color={c.accent}
                style={{ animation: "spin 1s linear infinite" }}
              />
              <p
                style={{
                  fontSize: "13px",
                  color: c.textMuted,
                  margin: "12px 0 0",
                }}
              >
                Loading posts...
              </p>
            </div>
          ) : results.posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🤷</div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: c.textTer,
                  margin: "0 0 6px",
                }}
              >
                No posts found
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: c.textMuted,
                  margin: 0,
                }}
              >
                Be the first to post with #{tag}!
              </p>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {results.posts.slice(0, 5).map((post) => (
                <PostPreview
                  key={post.id}
                  post={post}
                  c={c}
                  onClose={onClose}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.posts.length > 0 && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: `1px solid ${c.border}`,
              background: c.bgSubtle,
            }}
          >
            <button
              onClick={handleViewAll}
              style={{
                width: "100%",
                padding: "11px",
                background: "linear-gradient(135deg,#3B82F6,#2563eb)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontFamily: "Inter, sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              See all results for #{tag}
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes modalPop {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.9);
            }
            100% {
              opacity: 1;
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

/* Compact post preview for hashtag results */
const PostPreview = ({ post, c, onClose }) => {
  const navigate = useNavigate();

  const handleAuthorClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${post.author?.username}`);
    onClose();
  };

  // Get a preview of the content
  const preview = (() => {
    if (post.text?.content) return post.text.content.substring(0, 80);
    if (post.caption) return post.caption.substring(0, 80);
    if (post.link?.title) return `🔗 ${post.link.title}`;
    if (post.type === "image") return `🖼️ Image post`;
    if (post.type === "video") return `🎬 Video post`;
    return "Post";
  })();

  const letter = post.author?.fullName?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      style={{
        padding: "12px",
        background: c.bgSubtle,
        borderRadius: "12px",
        border: `1px solid ${c.border}`,
        transition: "all 0.15s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = c.bgHover;
        e.currentTarget.style.borderColor = c.borderStrong;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = c.bgSubtle;
        e.currentTarget.style.borderColor = c.border;
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "6px",
        }}
      >
        <div
          onClick={handleAuthorClick}
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700 }}>
            {letter}
          </span>
        </div>
        <span
          onClick={handleAuthorClick}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: c.text,
            cursor: "pointer",
          }}
        >
          {post.author?.fullName || post.author?.username}
        </span>
        <span style={{ fontSize: "11px", color: c.textMuted }}>
          @{post.author?.username}
        </span>
      </div>

      <p
        style={{
          fontSize: "13px",
          color: c.textSec,
          margin: 0,
          lineHeight: 1.4,
          wordBreak: "break-word",
        }}
      >
        {preview}
        {preview.length >= 80 ? "..." : ""}
      </p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "6px",
          fontSize: "11px",
          color: c.textMuted,
        }}
      >
        <span>❤️ {post.stats?.likes || 0}</span>
        <span>💬 {post.stats?.comments || 0}</span>
      </div>
    </div>
  );
};

export default HashtagModal;
