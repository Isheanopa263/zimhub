import { useState, useEffect } from "react";
import api from "../api/axios";

/**
 * Fetch active announcements for display
 */
const useAnnouncements = (limit = 5) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/announcements", {
          params: { limit },
        });
        setAnnouncements(response.data?.data || []);
      } catch {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [limit]);

  return { announcements, loading };
};

export default useAnnouncements;
