import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import useAuthStore from "../store/authStore";

const CHECK_INTERVAL = 60 * 1000; // 60 seconds

/**
 * Polls for new posts in the background.
 * Returns the count of new posts available (not yet shown in feed).
 *
 * Pass `onRefresh` to clear the count when user reloads.
 */
const useNewPostsCheck = (active = true) => {
  const { isAuthenticated } = useAuthStore();
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [lastFeedTimestamp, setLastFeedTimestamp] = useState(
    new Date().toISOString(),
  );

  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !active) return;

    const check = async () => {
      if (isCheckingRef.current || document.hidden) return;
      isCheckingRef.current = true;

      try {
        const response = await api.get("/posts/check-new", {
          params: { since: lastFeedTimestamp },
        });
        const count = response.data?.data?.count || 0;
        setNewPostsCount(count);
      } catch {
        // silent
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Don't check immediately (feed just loaded)
    const interval = setInterval(check, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, active, lastFeedTimestamp]);

  /* Call this when the user clicks "New posts" to clear */
  const resetNewPosts = () => {
    setNewPostsCount(0);
    setLastFeedTimestamp(new Date().toISOString());
  };

  return { newPostsCount, resetNewPosts };
};

export default useNewPostsCheck;
