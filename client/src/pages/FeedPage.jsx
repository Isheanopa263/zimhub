import { useEffect, useState, useCallback, useRef } from "react";

import usePosts from "../hooks/usePosts";
import useUIStore from "../store/uiStore";
import useAuthStore from "../store/authStore";
import useNewPostsCheck from "../hooks/useNewPostsCheck";
import useTheme from "../hooks/useTheme";

import ImmersivePost from "../components/posts/ImmersivePost";
import FeedSkeleton from "../components/posts/FeedSkeleton";
import CreatePostModal from "../components/posts/CreatePostModal";
import NewPostsIndicator from "../components/notifications/NewPostsIndicator";
import FilterDropdown from "../components/posts/FilterDropdown";
import AnnouncementBanner from "../components/announcements/AnnouncementBanner";

import { ChevronUp, ChevronDown } from "lucide-react";

/* ─── Calculate available height for feed ─── */
const useAvailableHeight = () => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const vh = window.innerHeight;
      const isMobile = window.innerWidth < 768;

      // Mobile: header (60px) + bottom nav (64px) + safe area
      // Desktop: no header/nav (sidebar is beside, not stacked)
      const headerHeight = isMobile ? 60 : 0;
      const bottomNavHeight = isMobile ? 64 : 0;

      const available = vh - headerHeight - bottomNavHeight;
      setHeight(Math.max(available, 300)); // minimum 300px
    };

    calculate();

    window.addEventListener("resize", calculate);
    window.addEventListener("orientationchange", () => {
      // Delay for orientation change to settle
      setTimeout(calculate, 100);
    });

    return () => {
      window.removeEventListener("resize", calculate);
      window.removeEventListener("orientationchange", calculate);
    };
  }, []);

  return height;
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const FeedPage = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTopBar, setShowTopBar] = useState(true);
  const { user } = useAuthStore();
  const { openCreatePost } = useUIStore();
  const { c } = useTheme();
  const isMobile = useIsMobile();
  const availableHeight = useAvailableHeight();

  const scrollContainerRef = useRef(null);
  const postRefs = useRef([]);
  const hideTimerRef = useRef(null);

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

  /* Load feed */
  useEffect(() => {
    loadFeed(activeFilter);
    setCurrentIndex(0);
  }, [activeFilter]);

  useEffect(() => {
    resetNewPosts();
  }, [activeFilter]);

  /* Reset refs */
  useEffect(() => {
    postRefs.current = postRefs.current.slice(0, posts.length);
  }, [posts]);

  /* Track active post with IntersectionObserver */
  useEffect(() => {
    if (!scrollContainerRef.current || posts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = parseInt(entry.target.dataset.index);
            if (!isNaN(index)) {
              setCurrentIndex(index);
              if (index >= posts.length - 3 && hasMore && !loadingMore) {
                loadMore(activeFilter);
              }
            }
          }
        });
      },
      {
        root: scrollContainerRef.current,
        threshold: [0.5],
      },
    );

    postRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [posts, hasMore, loadingMore, activeFilter]);

  /* Auto-hide top bar */
  useEffect(() => {
    const resetHideTimer = () => {
      setShowTopBar(true);
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowTopBar(false), 3000);
    };

    resetHideTimer();

    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", resetHideTimer, { passive: true });
    container.addEventListener("touchstart", resetHideTimer, { passive: true });

    return () => {
      clearTimeout(hideTimerRef.current);
      container.removeEventListener("scroll", resetHideTimer);
      container.removeEventListener("touchstart", resetHideTimer);
    };
  }, []);

  /* Keyboard navigation */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        scrollToPost(currentIndex + 1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        scrollToPost(currentIndex - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, posts.length]);

  /* Nav-tap-refresh */
  useEffect(() => {
    const handleRefresh = (e) => {
      if (e.detail?.page === "/feed") {
        const container = scrollContainerRef.current;
        if (container) {
          container.scrollTo({ top: 0, behavior: "smooth" });
        }
        setCurrentIndex(0);
        loadFeed(activeFilter);
        resetNewPosts();
      }
    };

    window.addEventListener("nav-tap-refresh", handleRefresh);
    return () => window.removeEventListener("nav-tap-refresh", handleRefresh);
  }, [activeFilter, loadFeed, resetNewPosts]);

  const scrollToPost = (index) => {
    if (index < 0 || index >= posts.length) return;
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: index * availableHeight,
        behavior: "smooth",
      });
    }
  };

  const handleLoadNewPosts = async () => {
    resetNewPosts();
    await loadFeed(activeFilter);
    scrollToPost(0);
  };

  /* Loading */
  if (loading && posts.length === 0) {
    return (
      <div
        style={{
          height: `${availableHeight}px`,
          overflow: "hidden",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid rgba(255,255,255,0.1)",
            borderTop: `4px solid ${c.accent}`,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  /* Empty */
  if (!loading && posts.length === 0) {
    return (
      <EmptyFeed
        onCreatePost={openCreatePost}
        filter={activeFilter}
        c={c}
        height={availableHeight}
      />
    );
  }

  return (
    <div
      style={{
        height: `${availableHeight}px`,
        background: "#000",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Floating Top Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
          opacity: showTopBar ? 1 : 0,
          transform: showTopBar ? "translateY(0)" : "translateY(-100%)",
          transition: "all 0.3s ease",
          pointerEvents: showTopBar ? "auto" : "none",
        }}
      >
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          For You
        </h1>
        <FilterDropdown value={activeFilter} onChange={setActiveFilter} />
      </div>

      {/* New Posts Indicator */}
      <div
        style={{
          position: "absolute",
          top: "60px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 25,
        }}
      >
        <NewPostsIndicator count={newPostsCount} onClick={handleLoadNewPosts} />
      </div>

      {/* Snap-Scroll Container */}
      <div
        ref={scrollContainerRef}
        style={{
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
        className="hide-scrollbar"
      >
        {posts.map((post, index) => (
          <div
            key={post.id}
            ref={(el) => (postRefs.current[index] = el)}
            data-index={index}
            style={{
              /* CRITICAL: Use exact pixel height, NOT percentage */
              height: `${availableHeight}px`,
              minHeight: `${availableHeight}px`,
              maxHeight: `${availableHeight}px`,
              scrollSnapAlign: "start",
              scrollSnapStop: "always",
              position: "relative",
            }}
          >
            <ImmersivePost
              post={post}
              isActive={index === currentIndex}
              onDelete={() => removePost(post.id)}
            />
          </div>
        ))}

        {/* Loading more */}
        {loadingMore && (
          <div
            style={{
              height: `${availableHeight}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              scrollSnapAlign: "start",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid rgba(255,255,255,0.2)",
                borderTop: `3px solid ${c.accent}`,
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        )}

        {/* End of feed */}
        {!hasMore && posts.length > 0 && (
          <div
            style={{
              height: `${availableHeight}px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              scrollSnapAlign: "start",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <div style={{ fontSize: "48px" }}>🎉</div>
            <p style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
              You've caught up!
            </p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.7 }}>
              Check back later for new posts
            </p>
          </div>
        )}
      </div>

      {/* Desktop Arrows */}
      {!isMobile && (
        <>
          <NavArrow
            direction="up"
            onClick={() => scrollToPost(currentIndex - 1)}
            disabled={currentIndex === 0}
            visible={showTopBar}
          />
          <NavArrow
            direction="down"
            onClick={() => scrollToPost(currentIndex + 1)}
            disabled={currentIndex >= posts.length - 1}
            visible={showTopBar}
          />
        </>
      )}

      {/* Progress Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "rgba(255,255,255,0.1)",
          zIndex: 15,
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #3B82F6, #8b5cf6)",
            width: `${posts.length > 0 ? ((currentIndex + 1) / posts.length) * 100 : 0}%`,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <CreatePostModal onPostCreated={addPost} />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0); }
          to   { transform: rotate(360deg); }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

/* ─── Nav Arrow ─── */
const NavArrow = ({ direction, onClick, disabled, visible }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      position: "absolute",
      right: "16px",
      [direction === "up" ? "top" : "bottom"]: "80px",
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(8px)",
      color: "#ffffff",
      border: "1px solid rgba(255,255,255,0.2)",
      cursor: disabled ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 20,
      opacity: visible ? (disabled ? 0.3 : 1) : 0,
      transition: "all 0.3s ease",
      pointerEvents: visible ? "auto" : "none",
    }}
  >
    {direction === "up" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
  </button>
);

/* ─── Empty State ─── */
const EmptyFeed = ({ onCreatePost, filter, c, height }) => (
  <div
    style={{
      height: `${height}px`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "Inter, sans-serif",
      background: c.bg,
    }}
  >
    <div style={{ fontSize: "72px", marginBottom: "20px" }}>
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
        fontSize: "24px",
        fontWeight: 800,
        color: c.text,
        margin: "0 0 8px",
      }}
    >
      {filter === "all" ? "No posts yet" : `No ${filter} posts yet`}
    </h3>
    <p
      style={{
        fontSize: "15px",
        color: c.textTer,
        margin: "0 0 24px",
      }}
    >
      Be the first to share something!
    </p>
    <button
      onClick={onCreatePost}
      style={{
        background: "linear-gradient(135deg, #3B82F6, #2563eb)",
        color: "#fff",
        border: "none",
        padding: "14px 32px",
        borderRadius: "14px",
        fontWeight: 700,
        cursor: "pointer",
        fontSize: "15px",
        boxShadow: "0 8px 24px rgba(59, 130, 246, 0.4)",
      }}
    >
      Create First Post
    </button>
  </div>
);

export default FeedPage;
