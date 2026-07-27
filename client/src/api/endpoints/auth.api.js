import api from "../axios";

export const authApi = {
  // Register (no OTP — instant with security question)
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  // Login
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

  // Password reset (security question)
  getSecurityQuestion: async (email) => {
    const response = await api.post("/auth/password-reset/question", { email });
    return response.data;
  },

  resetPassword: async ({ email, securityAnswer, newPassword }) => {
    const response = await api.post("/auth/password-reset/confirm", {
      email,
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
