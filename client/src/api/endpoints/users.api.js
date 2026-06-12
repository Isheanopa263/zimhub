import api from "../axios";

export const usersApi = {
  /**
   * Get profile by username
   */
  getProfile: async (username) => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },

  /**
   * Update own profile (multipart for optional avatar)
   */
  updateProfile: async (formData) => {
    const response = await api.patch("/users/me", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Remove own avatar
   */
  removeAvatar: async () => {
    const response = await api.delete("/users/me/avatar");
    return response.data;
  },
};
