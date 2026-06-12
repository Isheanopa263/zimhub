import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { postsApi } from "../api/endpoints/posts.api";

const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [meta, setMeta] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Prevent double-fetch in React StrictMode
  const currentFilterRef = useRef("all");
  const fetchingRef = useRef(false);

  /* ── Load first page ─────────────────────────────────────── */
  const loadFeed = useCallback(async (type = "all") => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    currentFilterRef.current = type;

    setLoading(true);
    setPosts([]);
    setHasMore(true);

    try {
      const response = await postsApi.getFeed({ page: 1, limit: 10, type });

      // Ignore stale responses if filter changed
      if (currentFilterRef.current !== type) return;

      const data = response?.data ?? [];
      const m = response?.meta ?? null;

      setPosts(Array.isArray(data) ? data : []);
      setMeta(m);
      setHasMore(m?.hasNextPage ?? false);
    } catch (error) {
      console.error("loadFeed error:", error);
      const msg = error?.response?.data?.message || "Failed to load feed";
      toast.error(msg);
      setPosts([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  /* ── Load next page ──────────────────────────────────────── */
  const loadMore = useCallback(
    async (type = "all") => {
      if (loadingMore || !hasMore || !meta) return;

      setLoadingMore(true);
      try {
        const nextPage = (meta?.page ?? 1) + 1;
        const response = await postsApi.getFeed({
          page: nextPage,
          limit: 10,
          type,
        });

        const data = response?.data ?? [];
        const m = response?.meta ?? null;

        setPosts((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
        setMeta(m);
        setHasMore(m?.hasNextPage ?? false);
      } catch (error) {
        console.error("loadMore error:", error);
        toast.error("Failed to load more posts");
      } finally {
        setLoadingMore(false);
      }
    },
    [loadingMore, hasMore, meta],
  );

  /* ── Prepend new post ────────────────────────────────────── */
  const addPost = useCallback((newPost) => {
    if (!newPost) return;
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  /* ── Remove post ─────────────────────────────────────────── */
  const removePost = useCallback(async (postId) => {
    try {
      await postsApi.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete post");
    }
  }, []);

  /* ── Toggle like locally (optimistic) ───────────────────── */
  const updatePostLike = useCallback((postId, isLiked, likeCount) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked,
              stats: { ...post.stats, likes: likeCount },
            }
          : post,
      ),
    );
  }, []);

  return {
    posts,
    loading,
    loadingMore,
    meta,
    hasMore,
    loadFeed,
    loadMore,
    addPost,
    removePost,
    updatePostLike,
  };
};

export default usePosts;
