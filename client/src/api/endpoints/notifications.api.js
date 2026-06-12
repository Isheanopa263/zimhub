import api from "../axios";

export const notificationsApi = {
  /**
   * Get all notifications
   */
  getAll: async ({ page = 1, limit = 20 } = {}) => {
    const response = await api.get("/notifications", {
      params: { page, limit },
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
   * Delete notification
   */
  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};
