const express = require("express");
const router = express.Router();

const controller = require("./auth.controller");
const { authenticate } = require("../../middleware/auth");
const {
  authLimiter,
  refreshTokenLimiter,
} = require("../../middleware/rateLimiter");
const validate = require("../../middleware/validate");
const { body } = require("express-validator");

// ─── Validators ──

const registerValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s'\-.]+$/),
  body("username")
    .trim()
    .notEmpty()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .toLowerCase(),
  body("email").trim().notEmpty().isEmail().normalizeEmail(),
  body("password")
    .notEmpty()
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body("securityQuestion")
    .trim()
    .notEmpty()
    .withMessage("Security question is required")
    .isLength({ min: 5, max: 255 }),
  body("securityAnswer")
    .trim()
    .notEmpty()
    .withMessage("Security answer is required")
    .isLength({ min: 2, max: 100 }),
  body("bio").optional().trim().isLength({ max: 300 }),
];

const loginValidator = [
  body("identifier").trim().notEmpty(),
  body("password").notEmpty(),
];

const resetRequestValidator = [
  body("email").trim().notEmpty().isEmail().normalizeEmail(),
];

const resetConfirmValidator = [
  body("email").trim().notEmpty().isEmail().normalizeEmail(),
  body("securityAnswer").trim().notEmpty(),
  body("newPassword")
    .notEmpty()
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

const deleteAccountValidator = [
  body("securityAnswer")
    .trim()
    .notEmpty()
    .withMessage("Security answer is required"),
];

const changePasswordValidator = [
  body("currentPassword").notEmpty(),
  body("newPassword")
    .notEmpty()
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

const refreshValidator = [body("refreshToken").notEmpty()];

// ─── Public Routes ──

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
  refreshValidator,
  validate,
  controller.refresh,
);

router.post("/logout", controller.logout);

// Password reset (security question)
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

// ─── Protected Routes ──

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
