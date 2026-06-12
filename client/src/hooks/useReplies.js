import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { commentsApi } from "../api/endpoints/comments.api";

/**
 * Hook for managing replies on a single comment
 */
const useReplies = (commentId) => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [meta, setMeta] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  /**
   * Load first page of replies
   */
  const loadReplies = useCallback(async () => {
    if (loading || !commentId) return;

    setLoading(true);
    try {
      const response = await commentsApi.getReplies(commentId, {
        page: 1,
        limit: 10,
      });
      setReplies(response.data || []);
      setMeta(response.meta);
      setHasMore(response.meta?.hasNextPage || false);
      setLoaded(true);
    } catch {
      toast.error("Failed to load replies");
    } finally {
      setLoading(false);
    }
  }, [commentId, loading]);

  /**
   * Load more replies (older ones)
   */
  const loadMore = async () => {
    if (!meta?.hasNextPage || loading) return;

    setLoading(true);
    try {
      const response = await commentsApi.getReplies(commentId, {
        page: meta.page + 1,
        limit: 10,
      });
      setReplies((prev) => [...prev, ...(response.data || [])]);
      setMeta(response.meta);
      setHasMore(response.meta?.hasNextPage || false);
    } catch {
      toast.error("Failed to load more replies");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a reply optimistically (called when user posts a reply)
   */
  const addReply = (reply) => {
    setReplies((prev) => [...prev, reply]);
  };

  /**
   * Remove a deleted reply
   */
  const removeReply = (replyId) => {
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
  };

  return {
    replies,
    loading,
    loaded,
    hasMore,
    loadReplies,
    loadMore,
    addReply,
    removeReply,
  };
};

export default useReplies;
