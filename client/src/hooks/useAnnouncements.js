import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

const useAnnouncements = (limit = 5) => {
  const { data, isLoading } = useQuery({
    queryKey: ["announcements", limit],
    queryFn: async () => {
      const response = await api.get("/announcements", { params: { limit } });
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 5, // Announcements are fresh for 5 minutes
  });

  return { announcements: data || [], loading: isLoading };
};

export default useAnnouncements;
