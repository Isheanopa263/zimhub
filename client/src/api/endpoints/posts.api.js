import api from "../axios";

export const postsApi = {
  /**
   * Get feed posts
   */
  getFeed: async ({ page = 1, limit = 10, type = "all" }) => {
    const response = await api.get("/posts/feed", {
      params: { page, limit, type },
    });
    return response.data;
  },

  /**
   * Get single post
   */
  getPost: async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  /**
   * Get user posts
   */
  getUserPosts: async (userId, { page = 1, limit = 10 }) => {
    const response = await api.get(`/posts/user/${userId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Create text post
   */
  createTextPost: async (data) => {
    const response = await api.post("/posts/text", data);
    return response.data;
  },

  /**
   * Create link post
   */
  createLinkPost: async (data) => {
    const response = await api.post("/posts/link", data);
    return response.data;
  },

  /**
   * Create image post
   */
  createImagePost: async (formData) => {
    const response = await api.post("/posts/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Create video post
   */
  createVideoPost: async (formData) => {
    const response = await api.post("/posts/video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Delete post
   */
  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },
};
