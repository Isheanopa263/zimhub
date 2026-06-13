import api from "../axios";

export const authApi = {
  // ── Registration (2 steps) ──
  requestRegistrationOTP: async (data) => {
    const response = await api.post("/auth/register/request", data);
    return response.data;
  },

  verifyRegistration: async (data) => {
    const response = await api.post("/auth/register/verify", data);
    return response.data;
  },

  // ── Login ──
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // ── Token management ──
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

  // ── Current user ──
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // ── Password ──
  changePassword: async (data) => {
    const response = await api.patch("/auth/change-password", data);
    return response.data;
  },

  requestPasswordReset: async (email) => {
    const response = await api.post("/auth/password-reset/request", { email });
    return response.data;
  },

  resetPassword: async ({ email, otp, newPassword }) => {
    const response = await api.post("/auth/password-reset/confirm", {
      email,
      otp,
      newPassword,
    });
    return response.data;
  },

  // ── Account deletion ──
  requestAccountDeletion: async () => {
    const response = await api.post("/auth/delete-account/request");
    return response.data;
  },

  confirmAccountDeletion: async (otp) => {
    const response = await api.delete("/auth/delete-account/confirm", {
      data: { otp },
    });
    return response.data;
  },
};
