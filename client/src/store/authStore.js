import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

/**
 * Global authentication state
 * Persisted to localStorage
 */
const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,

        // Actions
        setTokens: (accessToken, refreshToken) => {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          set({ accessToken, refreshToken });
        },

        setUser: (user) => {
          set({ user, isAuthenticated: !!user });
        },

        login: (user, accessToken, refreshToken) => {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
          });
        },

        logout: () => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        },

        updateUser: (updates) => {
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          }));
        },

        setLoading: (isLoading) => set({ isLoading }),
      }),
      {
        name: "zimhub-auth",
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);

export default useAuthStore;
