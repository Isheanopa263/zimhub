const { body } = require("express-validator");

const registerValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be 2-100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Only letters, spaces, hyphens and apostrophes"),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Only letters, numbers and underscores")
    .toLowerCase(),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email")
    .normalizeEmail()
    .toLowerCase(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Must contain uppercase, lowercase and a number"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Bio cannot exceed 300 characters"),
];

const verifyRegistrationValidator = [
  ...registerValidator,
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .matches(/^\d{6}$/)
    .withMessage("OTP must be 6 digits"),
];

const loginValidator = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email or username is required"),

  body("password").notEmpty().withMessage("Password is required"),
];

const refreshTokenValidator = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Must contain uppercase, lowercase and a number"),
];

const requestOTPValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email")
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email")
    .normalizeEmail(),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .matches(/^\d{6}$/)
    .withMessage("OTP must be 6 digits"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Must contain uppercase, lowercase and a number"),
];

const confirmDeletionValidator = [
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .matches(/^\d{6}$/)
    .withMessage("OTP must be 6 digits"),
];

module.exports = {
  registerValidator,
  verifyRegistrationValidator,
  loginValidator,
  refreshTokenValidator,
  changePasswordValidator,
  requestOTPValidator,
  resetPasswordValidator,
  confirmDeletionValidator,
};
