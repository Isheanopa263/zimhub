import api from "../axios";

export const adminApi = {
  // ── Dashboard ──
  getDashboard: async () => {
    const response = await api.get("/admin/dashboard");
    return response.data;
  },

  // ── Users ──
  getUsers: async ({
    page = 1,
    limit = 20,
    search = "",
    role = "all",
    status = "all",
  } = {}) => {
    const response = await api.get("/admin/users", {
      params: { page, limit, search, role, status },
    });
    return response.data;
  },

  toggleSuspension: async (userId) => {
    const response = await api.patch(
      `/admin/users/${userId}/toggle-suspension`,
    );
    return response.data;
  },

  changeRole: async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // ── Posts ──
  getPosts: async ({ page = 1, limit = 20, includeDeleted = false } = {}) => {
    const response = await api.get("/admin/posts", {
      params: { page, limit, includeDeleted },
    });
    return response.data;
  },

  deletePost: async (id) => {
    const response = await api.delete(`/admin/posts/${id}`);
    return response.data;
  },

  // ── Notices ──
  getNotices: async ({ page = 1, limit = 20 } = {}) => {
    const response = await api.get("/admin/notices", {
      params: { page, limit },
    });
    return response.data;
  },

  deleteNotice: async (id) => {
    const response = await api.delete(`/admin/notices/${id}`);
    return response.data;
  },

  // ── Announcements ──
  getAnnouncements: async ({ page = 1, limit = 20 } = {}) => {
    const response = await api.get("/admin/announcements", {
      params: { page, limit },
    });
    return response.data;
  },

  createAnnouncement: async ({ title, content }) => {
    const response = await api.post("/admin/announcements", { title, content });
    return response.data;
  },

  updateAnnouncement: async (id, data) => {
    const response = await api.patch(`/admin/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id) => {
    const response = await api.delete(`/admin/announcements/${id}`);
    return response.data;
  },

  broadcastAnnouncement: async (id) => {
    const response = await api.post(`/admin/announcements/${id}/broadcast`);
    return response.data;
  },
};
