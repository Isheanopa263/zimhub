import { useEffect, useState, useCallback, useRef } from "react";
import { Type, ImagePlus, Video, Link2 } from "lucide-react";
import usePosts from "../hooks/usePosts";
import useUIStore from "../store/uiStore";
import useAuthStore from "../store/authStore";
import PostCard from "../components/posts/PostCard";
import FeedSkeleton from "../components/posts/FeedSkeleton";
import CreatePostModal from "../components/posts/CreatePostModal";

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "text", label: "Text", icon: Type },
  { key: "image", label: "Photos", icon: ImagePlus },
  { key: "video", label: "Videos", icon: Video },
  { key: "link", label: "Links", icon: Link2 },
];

const FeedPage = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const { user } = useAuthStore();
  const { openCreatePost } = useUIStore();
  const observerRef = useRef(null);

  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    loadFeed,
    loadMore,
    addPost,
    removePost,
  } = usePosts();

  useEffect(() => {
    loadFeed(activeFilter);
  }, [activeFilter]);

  const lastPostRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore(activeFilter);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasMore, activeFilter],
  );

  const avatarLetter =
    user?.profile?.full_name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        paddingBottom: "20px",
      }}
    >
      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          padding: "12px 0 8px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {FILTER_TABS.map(({ key, label, icon: Icon }) => {
          const active = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: "13px",
                fontWeight: active ? 700 : 500,
                fontFamily: "Inter, sans-serif",
                background: active
                  ? "linear-gradient(135deg,#3B82F6,#2563eb)"
                  : "#f1f5f9",
                color: active ? "#ffffff" : "#64748b",
                transition: "all 0.15s ease",
                flexShrink: 0,
                boxShadow: active ? "0 2px 8px rgba(59,130,246,0.3)" : "none",
              }}
            >
              {Icon && <Icon size={13} />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Create prompt */}
      <div
        onClick={openCreatePost}
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #f1f5f9",
          padding: "12px 16px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#3B82F6,#8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>
            {avatarLetter}
          </span>
        </div>

        <span style={{ fontSize: "14px", color: "#94a3b8", flex: 1 }}>
          What's on your mind, {user?.profile?.full_name?.split(" ")[0]}?
        </span>

        <div
          style={{
            background: "linear-gradient(135deg,#3B82F6,#2563eb)",
            color: "#fff",
            padding: "7px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(59,130,246,0.3)",
          }}
        >
          Post
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <FeedSkeleton count={4} />
      ) : posts.length === 0 ? (
        <EmptyFeed onCreatePost={openCreatePost} filter={activeFilter} />
      ) : (
        <>
          {posts.map((post, index) => {
            const isLast = index === posts.length - 1;
            return (
              <div key={post.id} ref={isLast ? lastPostRef : undefined}>
                <PostCard post={post} onDelete={() => removePost(post.id)} />
              </div>
            );
          })}

          {loadingMore && <LoadingMoreSpinner />}

          {!hasMore && posts.length > 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "30px 20px",
                color: "#cbd5e1",
                fontSize: "13px",
              }}
            >
              ✓ You're all caught up
            </div>
          )}
        </>
      )}

      <CreatePostModal onPostCreated={addPost} />
    </div>
  );
};

const EmptyFeed = ({ onCreatePost, filter }) => (
  <div style={{ textAlign: "center", padding: "60px 20px" }}>
    <div style={{ fontSize: "52px", marginBottom: "16px" }}>
      {filter === "video"
        ? "🎬"
        : filter === "image"
          ? "🖼️"
          : filter === "link"
            ? "🔗"
            : filter === "text"
              ? "✍️"
              : "📭"}
    </div>
    <h3
      style={{
        fontSize: "18px",
        fontWeight: 700,
        color: "#64748b",
        margin: "0 0 8px",
      }}
    >
      {filter === "all" ? "No posts yet" : `No ${filter} posts yet`}
    </h3>
    <p style={{ fontSize: "14px", color: "#94a3b8", margin: "0 0 24px" }}>
      Be the first to share something!
    </p>
    <button
      onClick={onCreatePost}
      style={{
        background: "linear-gradient(135deg,#3B82F6,#2563eb)",
        color: "#fff",
        border: "none",
        padding: "12px 28px",
        borderRadius: "12px",
        fontWeight: 700,
        cursor: "pointer",
        fontSize: "14px",
        boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
      }}
    >
      Create Post
    </button>
  </div>
);

const LoadingMoreSpinner = () => (
  <div style={{ textAlign: "center", padding: "24px" }}>
    <div
      style={{
        width: "28px",
        height: "28px",
        border: "3px solid #e2e8f0",
        borderTop: "3px solid #3B82F6",
        borderRadius: "50%",
        margin: "0 auto",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default FeedPage;
