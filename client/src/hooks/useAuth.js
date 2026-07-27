import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import { authApi } from "../api/endpoints/auth.api";

const useAuth = () => {
  const navigate = useNavigate();
  const { login, logout, user, isAuthenticated, isLoading, setLoading } =
    useAuthStore();

  // Register (instant — no OTP)
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
        const message = error.response?.data?.message || "Registration failed";
        toast.error(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, setLoading],
  );

  // Login
  const handleLogin = useCallback(
    async ({ identifier, password }) => {
      setLoading(true);
      try {
        const response = await authApi.login({ identifier, password });
        const { user, accessToken, refreshToken } = response.data;
        login(user, accessToken, refreshToken);
        navigate("/feed");
        return { success: true };
      } catch (error) {
        return { success: false, message: error.response?.data?.message };
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, setLoading],
  );

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await authApi.logout(refreshToken);
    } catch {
    } finally {
      logout();
      navigate("/login");
      toast.success("Logged out successfully");
    }
  }, [logout, navigate]);

  // Get security question
  const getSecurityQuestion = useCallback(async (email) => {
    try {
      const response = await authApi.getSecurityQuestion(email);
      return { success: true, question: response.data.question };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(
    async (data) => {
      try {
        await authApi.resetPassword(data);
        toast.success("Password reset! Please login.");
        navigate("/login");
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || "Reset failed";
        toast.error(message);
        return { success: false, message };
      }
    },
    [navigate],
  );

  // Delete account
  const deleteAccount = useCallback(
    async (securityAnswer) => {
      try {
        await authApi.deleteAccount(securityAnswer);
        toast.success("Account deleted permanently");
        logout();
        navigate("/login");
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || "Deletion failed";
        toast.error(message);
        return { success: false, message };
      }
    },
    [logout, navigate],
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    register,
    login: handleLogin,
    logout: handleLogout,
    getSecurityQuestion,
    resetPassword,
    deleteAccount,
  };
};

export default useAuth;
