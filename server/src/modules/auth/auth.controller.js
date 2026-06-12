const authService = require("./auth.service");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");

/**
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { fullName, username, email, password, bio } = req.body;

    const result = await authService.registerUser({
      fullName,
      username,
      email,
      password,
      bio,
    });

    return ApiResponse.created(res, "Account created successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser({ email, password });

    return ApiResponse.success(res, "Login successful", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshAccessToken(refreshToken);

    return ApiResponse.success(res, "Tokens refreshed successfully", tokens);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logoutUser(refreshToken);
    }

    return ApiResponse.success(res, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout-all
 * Logout from all devices
 */
const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAllDevices(req.user.id);

    return ApiResponse.success(res, "Logged out from all devices");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    return ApiResponse.success(res, "User retrieved successfully", user);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    return ApiResponse.success(
      res,
      "Password changed successfully. Please login again.",
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  changePassword,
};
