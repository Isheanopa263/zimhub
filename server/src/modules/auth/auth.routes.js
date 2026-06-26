const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const { authenticate } = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const {
  authLimiter,
  refreshTokenLimiter,
} = require("../../middleware/rateLimiter");

const {
  registerValidator,
  verifyRegistrationValidator,
  loginValidator,
  refreshTokenValidator,
  changePasswordValidator,
  requestOTPValidator,
  resetPasswordValidator,
  confirmDeletionValidator,
} = require("./auth.validators");

// ─── Public ──────────────────────────────────────────────────────

// POST /auth/register/request — STEP 1: Send OTP
router.post(
  "/register/request",
  authLimiter,
  registerValidator,
  validate,
  authController.requestRegistrationOTP,
);

// POST /auth/register/verify — STEP 2: Verify OTP + create
router.post(
  "/register/verify",
  authLimiter,
  verifyRegistrationValidator,
  validate,
  authController.verifyAndCreateAccount,
);

// POST /auth/login (email or username)
router.post(
  "/login",
  authLimiter,
  loginValidator,
  validate,
  authController.login,
);

// POST /auth/refresh
router.post(
  "/refresh",
  refreshTokenValidator,
  validate,
  refreshTokenLimiter,
  authController.refresh,
);

// POST /auth/logout
router.post("/logout", authController.logout);

// Password reset (2-step OTP)
router.post(
  "/password-reset/request",
  authLimiter,
  requestOTPValidator,
  validate,
  authController.requestPasswordReset,
);

router.post(
  "/password-reset/confirm",
  authLimiter,
  resetPasswordValidator,
  validate,
  authController.resetPassword,
);

// ─── Protected ────────────────────────────────────────────────────

router.get("/me", authenticate, authController.getMe);

router.post("/logout-all", authenticate, authController.logoutAll);

router.patch(
  "/change-password",
  authenticate,
  changePasswordValidator,
  validate,
  authController.changePassword,
);

// Account deletion (2-step OTP)
router.post(
  "/delete-account/request",
  authenticate,
  authController.requestAccountDeletion,
);

router.delete(
  "/delete-account/confirm",
  authenticate,
  confirmDeletionValidator,
  validate,
  authController.confirmAccountDeletion,
);

// ─── DEV ONLY: Test email config ──────────────────────────────────
if (process.env.NODE_ENV === "development") {
  router.post("/test-email", async (req, res) => {
    const { testEmailConfig } = require("../../utils/email");
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    }
    const result = await testEmailConfig(email);
    res.json(result);
  });
}

module.exports = router;
