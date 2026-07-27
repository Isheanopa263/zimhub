const authService = require("./auth.service");
const ApiResponse = require("../../utils/ApiResponse");

const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return ApiResponse.created(res, "Account created successfully", result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    return ApiResponse.success(res, "Login successful", result);
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const tokens = await authService.refreshAccessToken(req.body.refreshToken);
    return ApiResponse.success(res, "Tokens refreshed", tokens);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.body.refreshToken) {
      await authService.logoutUser(req.body.refreshToken);
    }
    return ApiResponse.success(res, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAllDevices(req.user.id);
    return ApiResponse.success(res, "Logged out from all devices");
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return ApiResponse.success(res, "User retrieved", user);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    return ApiResponse.success(res, "Password changed. Please login again.");
  } catch (error) {
    next(error);
  }
};

// ── Security Question Based ──

const getSecurityQuestion = async (req, res, next) => {
  try {
    const result = await authService.getSecurityQuestion(req.body.email);
    return ApiResponse.success(res, "Security question retrieved", result);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPasswordWithSecurityAnswer(req.body);
    return ApiResponse.success(res, result.message);
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await authService.deleteAccountWithSecurityAnswer(
      req.user.id,
      req.body.securityAnswer,
    );
    return ApiResponse.success(res, "Account deleted permanently");
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
  getSecurityQuestion,
  resetPassword,
  deleteAccount,
};
