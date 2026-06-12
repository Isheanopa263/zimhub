import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import AppLayout from "./components/layout/AppLayout";
import { ProtectedRoute, PublicRoute } from "./components/auth/ProtectedRoute";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import FeedPage from "./pages/FeedPage";
import SearchPage from "./pages/SearchPage";
import NoticePage from "./pages/NoticePage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/admin/AdminPage";
import DebugImage from "./pages/DebugImage";

import useAuthStore from "./store/authStore";
import { authApi } from "./api/endpoints/auth.api";

const App = () => {
  const { isAuthenticated, setUser, logout } = useAuthStore();

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await authApi.getMe();
        setUser(response.data);
      } catch {
        logout();
      }
    };
    verifyAuth();
  }, []);

  return (
    <Routes>
      <Route path="/debug" element={<DebugImage />} />

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

      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/feed" : "/login"} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
