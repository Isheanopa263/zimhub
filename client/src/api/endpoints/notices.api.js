import api from "../axios";

export const noticesApi = {
  /**
   * Get notices list
   */
  getAll: async ({
    page = 1,
    limit = 10,
    status = "all",
    search = "",
    mine = false,
  } = {}) => {
    const response = await api.get("/notices", {
      params: { page, limit, status, search, mine },
    });
    return response.data;
  },

  /**
   * Get single notice
   */
  getOne: async (id) => {
    const response = await api.get(`/notices/${id}`);
    return response.data;
  },

  /**
   * Create notice (multipart for optional poster)
   */
  create: async (formData) => {
    const response = await api.post("/notices", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Update notice
   */
  update: async (id, formData) => {
    const response = await api.patch(`/notices/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Toggle status (active ↔ closed)
   */
  toggleStatus: async (id) => {
    const response = await api.patch(`/notices/${id}/toggle-status`);
    return response.data;
  },

  /**
   * Delete notice
   */
  delete: async (id) => {
    const response = await api.delete(`/notices/${id}`);
    return response.data;
  },
};
