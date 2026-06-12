import { useEffect, useState, useCallback, useRef } from "react";

import usePosts from "../hooks/usePosts";
import useUIStore from "../store/uiStore";
import useAuthStore from "../store/authStore";
import useNewPostsCheck from "../hooks/useNewPostsCheck";
import useTheme from "../hooks/useTheme";
import { getAvatarUrl } from "../utils/media";

import PostCard from "../components/posts/PostCard";
import FeedSkeleton from "../components/posts/FeedSkeleton";
import CreatePostModal from "../components/posts/CreatePostModal";
import NewPostsIndicator from "../components/notifications/NewPostsIndicator";
import FilterDropdown from "../components/posts/FilterDropdown";
import AnnouncementBanner from "../components/announcements/AnnouncementBanner";

const useShowAnnouncements = () => {
  const [show, setShow] = useState(window.innerWidth < 1280);
  useEffect(() => {
    const handler = () => setShow(window.innerWidth < 1280);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return show;
};

const FeedPage = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const { user } = useAuthStore();
  const { openCreatePost } = useUIStore();
  const { c } = useTheme();
  const observerRef = useRef(null);

  const showAnnouncements = useShowAnnouncements();

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

  const { newPostsCount, resetNewPosts } = useNewPostsCheck(
    activeFilter === "all",
  );

  useEffect(() => {
    loadFeed(activeFilter);
  }, [activeFilter]);
  useEffect(() => {
    resetNewPosts();
  }, [activeFilter]);

  const lastPostRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) loadMore(activeFilter);
      });
      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasMore, activeFilter],
  );

  const handleLoadNewPosts = async () => {
    resetNewPosts();
    await loadFeed(activeFilter);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const avatarLetter =
    user?.profile?.full_name?.charAt(0)?.toUpperCase() || "U";
  const avatarSrc = getAvatarUrl(user?.profile?.avatar_url);

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        paddingBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 0 12px",
          gap: "12px",
        }}
      >
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: c.text,
            margin: 0,
          }}
        >
          Your Feed
        </h1>
        <FilterDropdown value={activeFilter} onChange={setActiveFilter} />
      </div>

      {showAnnouncements && <AnnouncementBanner />}

      <div
        onClick={openCreatePost}
        style={{
          background: c.bgCard,
          borderRadius: "16px",
          border: `1px solid ${c.border}`,
          padding: "12px 16px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
          boxShadow: c.shadowSm,
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = c.shadowMd)}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = c.shadowSm)}
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
            overflow: "hidden",
          }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={user?.profile?.full_name}
              onError={(e) => {
                e.target.style.display = "none";
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>
              {avatarLetter}
            </span>
          )}
        </div>

        <span style={{ fontSize: "14px", color: c.textMuted, flex: 1 }}>
          What's on your mind,{" "}
          {user?.profile?.full_name?.split(" ")[0] || "friend"}?
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

      <NewPostsIndicator count={newPostsCount} onClick={handleLoadNewPosts} />

      {loading ? (
        <FeedSkeleton count={4} />
      ) : posts.length === 0 ? (
        <EmptyFeed onCreatePost={openCreatePost} filter={activeFilter} c={c} />
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

          {loadingMore && <LoadingMoreSpinner c={c} />}

          {!hasMore && posts.length > 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "30px 20px",
                color: c.textFaint,
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

const EmptyFeed = ({ onCreatePost, filter, c }) => {
  const iconMap = {
    video: "🎬",
    image: "🖼️",
    link: "🔗",
    text: "✍️",
    all: "📭",
  };
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: "52px", marginBottom: "16px" }}>
        {iconMap[filter] || iconMap.all}
      </div>
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: c.textTer,
          margin: "0 0 8px",
        }}
      >
        {filter === "all" ? "No posts yet" : `No ${filter} posts yet`}
      </h3>
      <p style={{ fontSize: "14px", color: c.textMuted, margin: "0 0 24px" }}>
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
};

const LoadingMoreSpinner = ({ c }) => (
  <div style={{ textAlign: "center", padding: "24px" }}>
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

export default FeedPage;
