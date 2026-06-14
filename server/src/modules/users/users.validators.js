const { body, param } = require("express-validator");

const updateProfileValidator = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'\-.]+$/)
    .withMessage(
      "Full name can only contain letters, spaces, hyphens, apostrophes and periods",
    ),

  body("bio")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Bio cannot exceed 300 characters"),

  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers and underscores")
    .toLowerCase(),
];

const usernameValidator = [
  param("username").trim().notEmpty().withMessage("Username is required"),
];

module.exports = {
  updateProfileValidator,
  usernameValidator,
};
