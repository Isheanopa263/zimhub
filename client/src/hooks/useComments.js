import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { commentsApi } from "../api/endpoints/comments.api";

const useComments = (postId, enabled = false) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [meta, setMeta] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  /* Load top-level comments */
  const loadComments = useCallback(async () => {
    if (!postId || !enabled) return;

    setLoading(true);
    try {
      const response = await commentsApi.getPostComments(postId, {
        page: 1,
        limit: 20,
      });
      setComments(response.data || []);
      setMeta(response.meta);
      setHasMore(response.meta?.hasNextPage || false);
    } catch (error) {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [postId, enabled]);

  /* Load more top-level comments */
  const loadMore = async () => {
    if (!meta?.hasNextPage || loading) return;

    setLoading(true);
    try {
      const response = await commentsApi.getPostComments(postId, {
        page: meta.page + 1,
        limit: 20,
      });
      setComments((prev) => [...prev, ...(response.data || [])]);
      setMeta(response.meta);
      setHasMore(response.meta?.hasNextPage || false);
    } catch {
      toast.error("Failed to load more comments");
    } finally {
      setLoading(false);
    }
  };

  /* Create top-level comment OR reply */
  const createComment = async (content, parentCommentId = null) => {
    if (!content?.trim()) return;

    setSubmitting(true);
    try {
      const response = await commentsApi.create(
        postId,
        content.trim(),
        parentCommentId,
      );

      const newComment = response.data;

      if (parentCommentId) {
        // Reply — increment reply count on parent
        setComments((prev) =>
          prev.map((c) =>
            c.id === newComment.parentCommentId
              ? { ...c, replyCount: (c.replyCount || 0) + 1 }
              : c,
          ),
        );
      } else {
        // Top-level — prepend
        setComments((prev) => [newComment, ...prev]);
      }

      return newComment;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to post comment");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  /* Delete comment / reply */
  const deleteComment = async (
    commentId,
    wasReply = false,
    parentId = null,
  ) => {
    try {
      await commentsApi.delete(commentId);

      if (wasReply && parentId) {
        // Decrement parent's reply count
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replyCount: Math.max(0, (c.replyCount || 0) - 1) }
              : c,
          ),
        );
      } else {
        // Remove top-level comment
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }

      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  useEffect(() => {
    if (enabled) loadComments();
  }, [enabled, loadComments]);

  return {
    comments,
    loading,
    submitting,
    meta,
    hasMore,
    loadComments,
    loadMore,
    createComment,
    deleteComment,
  };
};

export default useComments;
