import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import { authApi } from "../api/endpoints/auth.api";

/**
 * Authentication hook
 * Provides login, logout, register actions with proper state management
 */
const useAuth = () => {
  const navigate = useNavigate();
  const { login, logout, user, isAuthenticated, isLoading, setLoading } =
    useAuthStore();

  /**
   * Register new user
   */
  const register = useCallback(
    async (formData) => {
      setLoading(true);
      try {
        const response = await authApi.register(formData);
        const { user, accessToken, refreshToken } = response.data;

        login(user, accessToken, refreshToken);
        toast.success("Welcome to ZimHub! 🎉");
        navigate("/feed");

        return { success: true };
      } catch (error) {
        const message =
          error.response?.data?.message || "Registration failed. Try again.";

        // Return field-level errors if available
        const errors = error.response?.data?.errors || [];
        toast.error(message);

        return { success: false, message, errors };
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, setLoading],
  );

  /**
   * Login user
   */
  const handleLogin = useCallback(
    async (credentials) => {
      setLoading(true);
      try {
        const response = await authApi.login(credentials);
        const { user, accessToken, refreshToken } = response.data;

        login(user, accessToken, refreshToken);
        toast.success(`Welcome back, ${user.profile.full_name}! 👋`);
        navigate("/feed");

        return { success: true };
      } catch (error) {
        const message =
          error.response?.data?.message || "Login failed. Try again.";
        toast.error(message);

        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, setLoading],
  );

  /**
   * Logout user
   */
  const handleLogout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await authApi.logout(refreshToken);
    } catch {
      // Logout even if API call fails
    } finally {
      logout();
      navigate("/login");
      toast.success("Logged out successfully");
    }
  }, [logout, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    register,
    login: handleLogin,
    logout: handleLogout,
  };
};

export default useAuth;
