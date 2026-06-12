const { body, param, query } = require("express-validator");

const createTextPostValidator = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 2000 })
    .withMessage("Content cannot exceed 2000 characters"),

  body("backgroundStyle")
    .optional()
    .isIn([
      "default",
      "gradient-blue",
      "gradient-purple",
      "gradient-green",
      "gradient-orange",
      "gradient-pink",
      "gradient-dark",
      "solid-blue",
      "solid-purple",
      "solid-green",
      "solid-dark",
    ])
    .withMessage("Invalid background style"),
];

const createLinkPostValidator = [
  body("url")
    .trim()
    .notEmpty()
    .withMessage("URL is required")
    .isURL()
    .withMessage("Please provide a valid URL"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Title cannot exceed 255 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("caption")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Caption cannot exceed 500 characters"),
];

const createMediaPostValidator = [
  body("caption")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Caption cannot exceed 500 characters"),
];

const feedQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  query("type")
    .optional()
    .isIn(["video", "image", "text", "link", "all"])
    .withMessage("Invalid post type filter"),
];

const postIdValidator = [param("id").isUUID().withMessage("Invalid post ID")];

module.exports = {
  createTextPostValidator,
  createLinkPostValidator,
  createMediaPostValidator,
  feedQueryValidator,
  postIdValidator,
};
