import api from "../axios";

export const likesApi = {
  /**
   * Toggle like on a post
   */
  toggle: async (postId) => {
    const response = await api.post(`/likes/posts/${postId}`);
    return response.data;
  },

  /**
   * Get list of users who liked a post
   */
  getLikes: async (postId, { page = 1, limit = 20 } = {}) => {
    const response = await api.get(`/likes/posts/${postId}`, {
      params: { page, limit },
    });
    return response.data;
  },
};
