import { useState } from "react";
import toast from "react-hot-toast";
import { likesApi } from "../api/endpoints/likes.api";

/**
 * Hook for toggling likes with optimistic UI
 */
const useLike = (initialIsLiked = false, initialCount = 0) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggleLike = async (postId) => {
    if (loading) return;

    // Optimistic update
    const prevLiked = isLiked;
    const prevCount = likeCount;

    const newLiked = !prevLiked;
    const newCount = newLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIsLiked(newLiked);
    setLikeCount(newCount);
    setLoading(true);

    try {
      const response = await likesApi.toggle(postId);
      // Sync with server response
      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.likeCount);
      return response.data;
    } catch (error) {
      // Revert on error
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error("Failed to update like");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { isLiked, likeCount, loading, toggleLike, setIsLiked, setLikeCount };
};

export default useLike;
