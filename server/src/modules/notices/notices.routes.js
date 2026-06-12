const express = require("express");
const router = express.Router();

const controller = require("./notices.controller");
const { authenticate } = require("../../middleware/auth");
const {
  uploadNoticeImage,
  handleUploadError,
} = require("../../middleware/upload");
const {
  readLimiter,
  createPostLimiter,
} = require("../../middleware/rateLimiter");
const validate = require("../../middleware/validate");

const {
  createNoticeValidator,
  updateNoticeValidator,
  noticeIdValidator,
  listNoticesValidator,
} = require("./notices.validators");

router.use(authenticate);

// GET /api/v1/notices
router.get(
  "/",
  readLimiter,
  listNoticesValidator,
  validate,
  controller.getNotices,
);

// POST /api/v1/notices
router.post(
  "/",
  createPostLimiter,
  uploadNoticeImage.single("poster"),
  handleUploadError,
  createNoticeValidator,
  validate,
  controller.createNotice,
);

// GET /api/v1/notices/:id
router.get("/:id", noticeIdValidator, validate, controller.getNotice);

// PATCH /api/v1/notices/:id
router.patch(
  "/:id",
  noticeIdValidator,
  uploadNoticeImage.single("poster"),
  handleUploadError,
  updateNoticeValidator,
  validate,
  controller.updateNotice,
);

// PATCH /api/v1/notices/:id/toggle-status
router.patch(
  "/:id/toggle-status",
  noticeIdValidator,
  validate,
  controller.toggleStatus,
);

// DELETE /api/v1/notices/:id
router.delete("/:id", noticeIdValidator, validate, controller.deleteNotice);

module.exports = router;
