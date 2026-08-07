const { body } = require("express-validator");

const registerValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be 2-100 characters")
    .matches(/^[a-zA-Z\s'\-.]+$/)
    .withMessage("Only letters, spaces, hyphens, apostrophes and periods"),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Only letters, numbers and underscores")
    .toLowerCase(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Must contain uppercase, lowercase and a number"),

  body("securityQuestion")
    .trim()
    .notEmpty()
    .withMessage("Security question is required")
    .isLength({ min: 5, max: 255 })
    .withMessage("Security question must be 5-255 characters"),

  body("securityAnswer")
    .trim()
    .notEmpty()
    .withMessage("Security answer is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Answer must be 2-100 characters"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Bio cannot exceed 300 characters"),
];

const loginValidator = [
  body("identifier").trim().notEmpty().withMessage("Username is required"),

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

const resetRequestValidator = [
  body("username").trim().notEmpty().withMessage("Username is required"),
];

const resetConfirmValidator = [
  body("username").trim().notEmpty().withMessage("Username is required"),

  body("securityAnswer")
    .trim()
    .notEmpty()
    .withMessage("Security answer is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Must contain uppercase, lowercase and a number"),
];

const deleteAccountValidator = [
  body("securityAnswer")
    .trim()
    .notEmpty()
    .withMessage("Security answer is required"),
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  changePasswordValidator,
  resetRequestValidator,
  resetConfirmValidator,
  deleteAccountValidator,
};
