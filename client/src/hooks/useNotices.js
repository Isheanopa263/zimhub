import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { noticesApi } from "../api/endpoints/notices.api";

const useNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [meta, setMeta] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchingRef = useRef(false);

  /**
   * Load notices (replace existing)
   */
  const loadNotices = useCallback(async (filters = {}) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setLoading(true);
    setNotices([]);

    try {
      const response = await noticesApi.getAll({
        page: 1,
        limit: 10,
        ...filters,
      });
      setNotices(response.data || []);
      setMeta(response.meta);
      setHasMore(response.meta?.hasNextPage || false);
    } catch (error) {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  /**
   * Load next page
   */
  const loadMore = useCallback(
    async (filters = {}) => {
      if (loadingMore || !hasMore || !meta) return;

      setLoadingMore(true);
      try {
        const response = await noticesApi.getAll({
          page: meta.page + 1,
          limit: 10,
          ...filters,
        });
        setNotices((prev) => [...prev, ...(response.data || [])]);
        setMeta(response.meta);
        setHasMore(response.meta?.hasNextPage || false);
      } catch {
        toast.error("Failed to load more");
      } finally {
        setLoadingMore(false);
      }
    },
    [loadingMore, hasMore, meta],
  );

  /**
   * Add new notice (prepend)
   */
  const addNotice = useCallback((notice) => {
    setNotices((prev) => [notice, ...prev]);
  }, []);

  /**
   * Update existing notice
   */
  const updateNotice = useCallback((updated) => {
    setNotices((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  }, []);

  /**
   * Toggle notice status
   */
  const toggleNoticeStatus = useCallback(
    async (id) => {
      try {
        const response = await noticesApi.toggleStatus(id);
        updateNotice(response.data);
        toast.success(`Notice ${response.data.status}`);
        return response.data;
      } catch {
        toast.error("Failed to update status");
      }
    },
    [updateNotice],
  );

  /**
   * Remove notice
   */
  const removeNotice = useCallback(async (id) => {
    try {
      await noticesApi.delete(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notice deleted");
    } catch {
      toast.error("Failed to delete notice");
    }
  }, []);

  return {
    notices,
    loading,
    loadingMore,
    meta,
    hasMore,
    loadNotices,
    loadMore,
    addNotice,
    updateNotice,
    toggleNoticeStatus,
    removeNotice,
  };
};

export default useNotices;
