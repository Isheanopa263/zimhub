const { body, param, query } = require("express-validator");

const createNoticeValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 255 })
    .withMessage("Title must be between 3 and 255 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("phoneNumber")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+\d\s\-()]{7,20}$/)
    .withMessage("Invalid phone number format"),

  body("whatsappNumber")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+\d\s\-()]{7,20}$/)
    .withMessage("Invalid WhatsApp number format"),

  body("emailAddress")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Invalid email address"),
];

const updateNoticeValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Title must be between 3 and 255 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("phoneNumber")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+\d\s\-()]{7,20}$/)
    .withMessage("Invalid phone number format"),

  body("whatsappNumber")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+\d\s\-()]{7,20}$/)
    .withMessage("Invalid WhatsApp number format"),

  body("emailAddress")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Invalid email address"),

  body("status")
    .optional()
    .isIn(["active", "closed"])
    .withMessage("Status must be active or closed"),
];

const noticeIdValidator = [
  param("id").isUUID().withMessage("Invalid notice ID"),
];

const listNoticesValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  query("status")
    .optional()
    .isIn(["active", "closed", "all"])
    .withMessage("Status must be active, closed or all"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search query too long"),

  query("mine").optional().isBoolean().toBoolean(),
];

module.exports = {
  createNoticeValidator,
  updateNoticeValidator,
  noticeIdValidator,
  listNoticesValidator,
};
