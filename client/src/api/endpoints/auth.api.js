import api from "../axios";

export const authApi = {
  // Register (no email — username + security question)
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  // Login (username only)
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // Token management
  refresh: async (refreshToken) => {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await api.post("/auth/logout", { refreshToken });
    return response.data;
  },

  logoutAll: async () => {
    const response = await api.post("/auth/logout-all");
    return response.data;
  },

  // Current user
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Password
  changePassword: async (data) => {
    const response = await api.patch("/auth/change-password", data);
    return response.data;
  },

  // Password reset (security question — username based)
  getSecurityQuestion: async (username) => {
    const response = await api.post("/auth/password-reset/question", {
      username,
    });
    return response.data;
  },

  resetPassword: async ({ username, securityAnswer, newPassword }) => {
    const response = await api.post("/auth/password-reset/confirm", {
      username,
      securityAnswer,
      newPassword,
    });
    return response.data;
  },

  // Account deletion (security question)
  deleteAccount: async (securityAnswer) => {
    const response = await api.delete("/auth/delete-account", {
      data: { securityAnswer },
    });
    return response.data;
  },
};
