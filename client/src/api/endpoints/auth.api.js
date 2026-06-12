import api from "../axios";

export const authApi = {
  /**
   * Register new user
   */
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  /**
   * Refresh tokens
   */
  refresh: async (refreshToken) => {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  },

  /**
   * Logout current session
   */
  logout: async (refreshToken) => {
    const response = await api.post("/auth/logout", { refreshToken });
    return response.data;
  },

  /**
   * Logout all devices
   */
  logoutAll: async () => {
    const response = await api.post("/auth/logout-all");
    return response.data;
  },

  /**
   * Get current user
   */
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data) => {
    const response = await api.patch("/auth/change-password", data);
    return response.data;
  },
};
