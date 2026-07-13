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
   * Create poll post
   */
  createPollPost: async (data) => {
    const response = await api.post("/posts/poll", data);
    return response.data;
  },

  /**
   * Vote on a poll
   */
  votePoll: async (postId, optionIds) => {
    const response = await api.post(`/posts/${postId}/vote`, { optionIds });
    return response.data;
  },

  /**
   * Create image post (multi-image carousel)
   *
   * FormData must include:
   *   - images: File[] (field name 'images', up to 10 files)
   *   - caption: string (optional)
   */
  createImagePost: async (formData) => {
    const response = await api.post("/posts/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // Mobile uploads can be slow — give them 60 seconds
      timeout: 60000,
      // Track upload progress (can be used for progress bar later)
      onUploadProgress: (progressEvent) => {
        // Uncomment to log progress:
        // const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        // console.log(`Upload: ${percent}%`);
      },
    });
    return response.data;
  },

  /**
   * Create video post
   *
   * FormData must include:
   *   - video: File (field name 'video', single file)
   *   - caption: string (optional)
   */
  createVideoPost: async (formData) => {
    const response = await api.post("/posts/video", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // Videos can be 100MB — give them 2 minutes
      timeout: 120000,
      onUploadProgress: (progressEvent) => {
        // Uncomment to log progress:
        // const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        // console.log(`Upload: ${percent}%`);
      },
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

  /**
   * Check for new posts since timestamp
   */
  checkNew: async (since) => {
    const response = await api.get("/posts/check-new", {
      params: { since },
    });
    return response.data;
  },
};
