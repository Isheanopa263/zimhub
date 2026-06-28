import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

/* ─── Endpoints that should NEVER trigger token refresh ─── */
const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register/request",
  "/auth/register/verify",
  "/auth/refresh",
  "/auth/password-reset/request",
  "/auth/password-reset/confirm",
];

const shouldSkipRefresh = (config) => {
  if (!config?.url) return false;
  return NO_REFRESH_PATHS.some((path) => config.url.includes(path));
};

/* ─── Request interceptor ─── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["ngrok-skip-browser-warning"] = "true";
    return config;
  },
  (error) => Promise.reject(error),
);

/* ─── Response interceptor ─── */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── DO NOT try to refresh for auth endpoints ──
    // If login itself returns 401, that's a real error (wrong password)
    if (shouldSkipRefresh(originalRequest)) {
      return Promise.reject(error);
    }

    // ── Only attempt refresh for OTHER endpoints that return 401 ──
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {
            refreshToken,
          },
          {
            headers: { "ngrok-skip-browser-warning": "true" },
          },
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        api.defaults.headers.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Only show toast and redirect if we were actually logged in
        // (i.e., not the initial /auth/me check that fails)
        const wasLoggedIn = !!localStorage.getItem("zimhub-auth");
        if (wasLoggedIn) {
          toast.error("Session expired. Please login again.");
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
