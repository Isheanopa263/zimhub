const { body, param } = require("express-validator");

const createCommentValidator = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment cannot be empty")
    .isLength({ max: 500 })
    .withMessage("Comment cannot exceed 500 characters"),

  body("parentCommentId")
    .optional()
    .isUUID()
    .withMessage("Invalid parent comment ID"),
];

const commentIdValidator = [
  param("id").isUUID().withMessage("Invalid comment ID"),
];

const postIdValidator = [
  param("postId").isUUID().withMessage("Invalid post ID"),
];

module.exports = {
  createCommentValidator,
  commentIdValidator,
  postIdValidator,
};
