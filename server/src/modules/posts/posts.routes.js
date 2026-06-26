const express = require("express");
const router = express.Router();

const postsController = require("./posts.controller");
const { authenticate } = require("../../middleware/auth");

const {
  uploadImage,
  uploadMultipleImages,
  uploadVideo,
  handleUploadError,
} = require("../../middleware/upload");

const {
  uploadLimiter,
  readLimiter,
  createPostLimiter,
} = require("../../middleware/rateLimiter");
const validate = require("../../middleware/validate");

const {
  createTextPostValidator,
  createLinkPostValidator,
  createMediaPostValidator,
  feedQueryValidator,
  postIdValidator,
} = require("./posts.validators");

router.use(authenticate);

// ─── Specific routes FIRST ────────────────────────────────────────────────────
router.get(
  "/feed",
  readLimiter,
  feedQueryValidator,
  validate,
  postsController.getFeed,
);
router.get("/check-new", readLimiter, postsController.checkNewPosts);
router.get("/user/:userId", readLimiter, postsController.getUserPosts);

// ─── Create Posts ──────────────────────────────────────────────────────────────
router.post(
  "/image",
  createPostLimiter,
  uploadLimiter,
  uploadMultipleImages.array("images", 10),
  handleUploadError,
  createMediaPostValidator,
  validate,
  postsController.createImagePost,
);

router.post(
  "/video",
  createPostLimiter,
  uploadLimiter,
  uploadVideo.single("video"),
  handleUploadError,
  createMediaPostValidator,
  validate,
  postsController.createVideoPost,
);

router.post(
  "/text",
  createPostLimiter,
  createTextPostValidator,
  validate,
  postsController.createTextPost,
);

router.post(
  "/link",
  createPostLimiter,
  createLinkPostValidator,
  validate,
  postsController.createLinkPost,
);

// ─── Single Post — MUST be last ───────────────────────────────────────────────
router.get("/:id", postIdValidator, validate, postsController.getPost);
router.delete("/:id", postIdValidator, validate, postsController.deletePost);

module.exports = router;
