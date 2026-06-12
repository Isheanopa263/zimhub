import api from "../axios";

export const notificationsApi = {
  /**
   * Get all notifications (paginated)
   */
  getAll: async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
    const response = await api.get("/notifications", {
      params: { page, limit, unreadOnly },
    });
    return response.data;
  },

  /**
   * Get unread count
   */
  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  /**
   * Poll for new notifications since a timestamp
   * Returns: { newNotifications, unreadCount, timestamp }
   */
  poll: async (since = null) => {
    const params = since ? { since } : {};
    const response = await api.get("/notifications/poll", { params });
    return response.data;
  },

  /**
   * Mark single as read
   */
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all as read
   */
  markAllAsRead: async () => {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  },

  /**
   * Delete one
   */
  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Clear all read notifications
   */
  clearRead: async () => {
    const response = await api.delete("/notifications/clear-read");
    return response.data;
  },
};
