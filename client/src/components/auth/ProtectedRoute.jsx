import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";

/**
 * Protects routes that require authentication
 * Redirects to /login if not authenticated
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Not logged in → redirect to login, save intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Admin-only route accessed by non-admin
  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/feed" replace />;
  }

  return children;
};

/**
 * Redirects authenticated users away from auth pages
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  return children;
};

export { ProtectedRoute, PublicRoute };
