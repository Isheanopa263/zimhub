import api from "../axios";

export const commentsApi = {
  /**
   * Get top-level comments for a post
   */
  getPostComments: async (postId, { page = 1, limit = 20 } = {}) => {
    const response = await api.get(`/comments/posts/${postId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get replies for a comment
   */
  getReplies: async (commentId, { page = 1, limit = 10 } = {}) => {
    const response = await api.get(`/comments/${commentId}/replies`, {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Create a comment OR reply (set parentCommentId for replies)
   */
  create: async (postId, content, parentCommentId = null) => {
    const payload = { content };
    if (parentCommentId) payload.parentCommentId = parentCommentId;

    const response = await api.post(`/comments/posts/${postId}`, payload);
    return response.data;
  },

  /**
   * Delete a comment
   */
  delete: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },
};
