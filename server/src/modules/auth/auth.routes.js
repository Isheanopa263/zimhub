const express = require("express");
const router = express.Router();

const controller = require("./auth.controller");
const { authenticate } = require("../../middleware/auth");
const {
  authLimiter,
  refreshTokenLimiter,
} = require("../../middleware/rateLimiter");
const validate = require("../../middleware/validate");
const {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  changePasswordValidator,
  resetRequestValidator,
  resetConfirmValidator,
  deleteAccountValidator,
} = require("./auth.validators");

/* ─── Public Routes ──────────────────────────────────────────────────────── */

router.post(
  "/register",
  authLimiter,
  registerValidator,
  validate,
  controller.register,
);

router.post("/login", authLimiter, loginValidator, validate, controller.login);

router.post(
  "/refresh",
  refreshTokenLimiter,
  refreshTokenValidator,
  validate,
  controller.refresh,
);

router.post("/logout", controller.logout);

// Password reset via security question
router.post(
  "/password-reset/question",
  authLimiter,
  resetRequestValidator,
  validate,
  controller.getSecurityQuestion,
);

router.post(
  "/password-reset/confirm",
  authLimiter,
  resetConfirmValidator,
  validate,
  controller.resetPassword,
);

/* ─── Protected Routes ───────────────────────────────────────────────────── */

router.get("/me", authenticate, controller.getMe);

router.post("/logout-all", authenticate, controller.logoutAll);

router.patch(
  "/change-password",
  authenticate,
  changePasswordValidator,
  validate,
  controller.changePassword,
);

router.delete(
  "/delete-account",
  authenticate,
  deleteAccountValidator,
  validate,
  controller.deleteAccount,
);

module.exports = router;
