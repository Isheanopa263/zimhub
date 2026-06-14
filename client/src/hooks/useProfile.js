import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { usersApi } from "../api/endpoints/users.api";
import { postsApi } from "../api/endpoints/posts.api";

const useProfile = (username) => {
  const queryClient = useQueryClient();

  // Cache profile data
  const {
    data: profile,
    isLoading: loading,
    error,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const response = await usersApi.getProfile(username);
      return response.data;
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Posts state (manual for pagination)
  const [posts, setPosts] = useState([]);
  const [postsMeta, setPostsMeta] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  // Load posts when profile is ready
  useEffect(() => {
    if (!profile?.id) return;

    setLoadingPosts(true);
    postsApi
      .getUserPosts(profile.id, { page: 1, limit: 10 })
      .then((res) => {
        setPosts(res.data || []);
        setPostsMeta(res.meta);
        setHasMorePosts(res.meta?.hasNextPage || false);
      })
      .finally(() => setLoadingPosts(false));
  }, [profile?.id]);

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
    } finally {
      setLoadingPosts(false);
    }
  };

  const updateProfileInState = useCallback(
    (updates) => {
      queryClient.setQueryData(["profile", username], (old) =>
        old ? { ...old, ...updates } : old,
      );
    },
    [queryClient, username],
  );

  const removePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  return {
    profile,
    posts,
    loading,
    loadingPosts,
    error: error?.response?.data?.message || error?.message,
    hasMorePosts,
    loadMorePosts,
    refreshProfile: refetchProfile,
    updateProfileInState,
    removePost,
  };
};

export default useProfile;
