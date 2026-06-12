import { useState, useEffect, useCallback } from "react";
import { usersApi } from "../api/endpoints/users.api";
import { postsApi } from "../api/endpoints/posts.api";

/**
 * Load profile + user posts
 */
const useProfile = (username) => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState(null);
  const [postsMeta, setPostsMeta] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  /* Load profile + first page of posts */
  const loadProfile = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    setError(null);

    try {
      const profileRes = await usersApi.getProfile(username);
      setProfile(profileRes.data);

      // Load user's posts
      const postsRes = await postsApi.getUserPosts(profileRes.data.id, {
        page: 1,
        limit: 10,
      });

      setPosts(postsRes.data || []);
      setPostsMeta(postsRes.meta);
      setHasMorePosts(postsRes.meta?.hasNextPage || false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load profile";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [username]);

  /* Load more posts */
  const loadMorePosts = async () => {
    if (loadingPosts || !hasMorePosts || !postsMeta || !profile) return;

    setLoadingPosts(true);
    try {
      const response = await postsApi.getUserPosts(profile.id, {
        page: postsMeta.page + 1,
        limit: 10,
      });

      setPosts((prev) => [...prev, ...(response.data || [])]);
      setPostsMeta(response.meta);
      setHasMorePosts(response.meta?.hasNextPage || false);
    } catch {
      // silent
    } finally {
      setLoadingPosts(false);
    }
  };

  /* Update profile data in state (after edit) */
  const updateProfileInState = useCallback((updates) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  /* Remove a post from the list */
  const removePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    posts,
    loading,
    loadingPosts,
    error,
    hasMorePosts,
    loadMorePosts,
    refreshProfile: loadProfile,
    updateProfileInState,
    removePost,
  };
};

export default useProfile;
