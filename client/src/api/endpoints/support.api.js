import api from "../axios";

export const supportApi = {
  // ── User Queries ──
  getMyQueries: async ({ page = 1, limit = 20, status } = {}) => {
    const response = await api.get("/support/queries", {
      params: { page, limit, status },
    });
    return response.data;
  },

  getMyQuery: async (id) => {
    const response = await api.get(`/support/queries/${id}`);
    return response.data;
  },

  createQuery: async ({ category, subject, message, priority }) => {
    const response = await api.post("/support/queries", {
      category,
      subject,
      message,
      priority,
    });
    return response.data;
  },

  reply: async (queryId, message) => {
    const response = await api.post(`/support/queries/${queryId}/replies`, {
      message,
    });
    return response.data;
  },

  getMyUnreadCount: async () => {
    const response = await api.get("/support/queries/unread-count");
    return response.data;
  },

  // ── Suggestions ──
  submitSuggestion: async ({ category, content }) => {
    const response = await api.post("/support/suggestions", {
      category,
      content,
    });
    return response.data;
  },

  // ── Admin: Queries ──
  adminGetQueries: async ({
    page = 1,
    limit = 20,
    status,
    priority,
    search,
  } = {}) => {
    const response = await api.get("/support/admin/queries", {
      params: { page, limit, status, priority, search },
    });
    return response.data;
  },

  adminGetQuery: async (id) => {
    const response = await api.get(`/support/admin/queries/${id}`);
    return response.data;
  },

  adminReply: async (queryId, message) => {
    const response = await api.post(
      `/support/admin/queries/${queryId}/replies`,
      { message },
    );
    return response.data;
  },

  adminUpdateQuery: async (id, { status, priority }) => {
    const response = await api.patch(`/support/admin/queries/${id}`, {
      status,
      priority,
    });
    return response.data;
  },

  adminGetUnreadCount: async () => {
    const response = await api.get("/support/admin/queries/unread-count");
    return response.data;
  },

  // ── Admin: Suggestions ──
  adminGetSuggestions: async ({
    page = 1,
    limit = 30,
    category,
    isRead,
    isArchived,
  } = {}) => {
    const response = await api.get("/support/admin/suggestions", {
      params: { page, limit, category, isRead, isArchived },
    });
    return response.data;
  },

  adminGetSuggestionStats: async () => {
    const response = await api.get("/support/admin/suggestions/stats");
    return response.data;
  },

  adminMarkSuggestionRead: async (id, isRead = true) => {
    const response = await api.patch(`/support/admin/suggestions/${id}/read`, {
      isRead,
    });
    return response.data;
  },

  adminArchiveSuggestion: async (id, isArchived = true) => {
    const response = await api.patch(
      `/support/admin/suggestions/${id}/archive`,
      { isArchived },
    );
    return response.data;
  },

  adminDeleteSuggestion: async (id) => {
    const response = await api.delete(`/support/admin/suggestions/${id}`);
    return response.data;
  },
};
