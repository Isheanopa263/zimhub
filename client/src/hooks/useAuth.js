import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import { authApi } from "../api/endpoints/auth.api";

const useAuth = () => {
  const navigate = useNavigate();
  const { login, logout, user, isAuthenticated, isLoading, setLoading } =
    useAuthStore();

  /* Step 1: Request OTP for registration */
  const requestRegistrationOTP = useCallback(
    async (formData) => {
      setLoading(true);
      try {
        await authApi.requestRegistrationOTP(formData);
        toast.success("Verification code sent to your email! 📧");
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || "Failed to send code";
        toast.error(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [setLoading],
  );

  /* Step 2: Verify OTP and create account */
  const verifyAndRegister = useCallback(
    async (formData) => {
      setLoading(true);
      try {
        const response = await authApi.verifyRegistration(formData);
        const { user, accessToken, refreshToken } = response.data;
        login(user, accessToken, refreshToken);
        toast.success("Welcome to ZimHub! 🎉");
        navigate("/feed");
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || "Verification failed";
        toast.error(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, setLoading],
  );

  /* Login (email or username) */
  const handleLogin = useCallback(
    async ({ identifier, password }) => {
      setLoading(true);
      try {
        const response = await authApi.login({ identifier, password });
        const { user, accessToken, refreshToken } = response.data;
        login(user, accessToken, refreshToken);
        toast.success(`Welcome back, ${user.profile.full_name}! 👋`);
        navigate("/feed");
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || "Login failed";
        toast.error(message);
        console.log(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, setLoading],
  );

  /* Logout */
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

  /* Password reset — step 1 */
  const requestPasswordReset = useCallback(async (email) => {
    try {
      await authApi.requestPasswordReset(email);
      toast.success("If this email exists, a code has been sent 📧");
      return { success: true };
    } catch (error) {
      toast.error("Failed to send code");
      return { success: false };
    }
  }, []);

  /* Password reset — step 2 */
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

  /* Account deletion — step 1 */
  const requestAccountDeletion = useCallback(async () => {
    try {
      await authApi.requestAccountDeletion();
      toast.success("Confirmation code sent to your email ⚠️");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send code";
      toast.error(message);
      return { success: false };
    }
  }, []);

  /* Account deletion — step 2 */
  const confirmAccountDeletion = useCallback(
    async (otp) => {
      try {
        await authApi.confirmAccountDeletion(otp);
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
    requestRegistrationOTP,
    verifyAndRegister,
    login: handleLogin,
    logout: handleLogout,
    requestPasswordReset,
    resetPassword,
    requestAccountDeletion,
    confirmAccountDeletion,
  };
};

export default useAuth;
