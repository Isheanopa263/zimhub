import api from "../axios";

export const searchApi = {
  /**
   * Global search across users, posts, notices
   */
  global: async (q, limit = 5) => {
    const response = await api.get("/search", {
      params: { q, limit },
    });
    return response.data;
  },

  /**
   * Search users only (paginated)
   */
  users: async (q, { page = 1, limit = 10 } = {}) => {
    const response = await api.get("/search/users", {
      params: { q, page, limit },
    });
    return response.data;
  },

  /**
   * Search posts only (paginated)
   */
  posts: async (q, { page = 1, limit = 10 } = {}) => {
    const response = await api.get("/search/posts", {
      params: { q, page, limit },
    });
    return response.data;
  },

  /**
   * Search notices only (paginated)
   */
  notices: async (q, { page = 1, limit = 10 } = {}) => {
    const response = await api.get("/search/notices", {
      params: { q, page, limit },
    });
    return response.data;
  },
};
