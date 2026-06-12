const express = require("express");
const router = express.Router();

const controller = require("./comments.controller");
const { authenticate } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

const {
  createCommentValidator,
  commentIdValidator,
  postIdValidator,
} = require("./comments.validators");

router.use(authenticate);

// GET /api/v1/comments/posts/:postId — list top-level comments
router.get(
  "/posts/:postId",
  postIdValidator,
  validate,
  controller.getPostComments,
);

// POST /api/v1/comments/posts/:postId — create a comment or reply
router.post(
  "/posts/:postId",
  postIdValidator,
  createCommentValidator,
  validate,
  controller.createComment,
);

// GET /api/v1/comments/:id/replies — list replies to a comment
router.get(
  "/:id/replies",
  commentIdValidator,
  validate,
  controller.getCommentReplies,
);

// DELETE /api/v1/comments/:id
router.delete("/:id", commentIdValidator, validate, controller.deleteComment);

module.exports = router;
