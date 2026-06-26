import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import AppLayout from "./components/layout/AppLayout";
import { ProtectedRoute, PublicRoute } from "./components/auth/ProtectedRoute";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import FeedPage from "./pages/FeedPage";
import SearchPage from "./pages/SearchPage";
import NoticePage from "./pages/NoticePage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/admin/AdminPage";
import SupportPage from "./pages/SupportPage";

import useAuthStore from "./store/authStore";
import useNotificationStore from "./store/notificationStore";
import { authApi } from "./api/endpoints/auth.api";
import { notificationsApi } from "./api/endpoints/notifications.api";

const App = () => {
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  useEffect(() => {
    const initialize = async () => {
      if (!isAuthenticated) return;

      try {
        const userResp = await authApi.getMe();
        setUser(userResp.data);
      } catch {
        logout();
        return;
      }

      try {
        const countResp = await notificationsApi.getUnreadCount();
        setUnreadCount(countResp.data?.count || 0);
      } catch {
        // silent
      }
    };

    initialize();
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/notices" element={<NoticePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="/support" element={<SupportPage />} />

      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/feed" : "/login"} replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
