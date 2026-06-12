const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const { authenticate } = require("../../middleware/auth");
const { authLimiter } = require("../../middleware/rateLimiter");
const validate = require("../../middleware/validate");

const {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  changePasswordValidator,
} = require("./auth.validators");

// ─── Public Routes ─────────────────────────────────────────────────────────────

// POST /api/v1/auth/register
router.post(
  "/register",
  authLimiter,
  registerValidator,
  validate,
  authController.register,
);

// POST /api/v1/auth/login
router.post(
  "/login",
  authLimiter,
  loginValidator,
  validate,
  authController.login,
);

// POST /api/v1/auth/refresh
router.post(
  "/refresh",
  refreshTokenValidator,
  validate,
  authController.refresh,
);

// POST /api/v1/auth/logout
router.post("/logout", authController.logout);

// ─── Protected Routes ──────────────────────────────────────────────────────────

// GET /api/v1/auth/me
router.get("/me", authenticate, authController.getMe);

// POST /api/v1/auth/logout-all
router.post("/logout-all", authenticate, authController.logoutAll);

// PATCH /api/v1/auth/change-password
router.patch(
  "/change-password",
  authenticate,
  changePasswordValidator,
  validate,
  authController.changePassword,
);

module.exports = router;
