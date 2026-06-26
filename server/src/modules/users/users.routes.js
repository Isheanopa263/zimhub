const express = require("express");
const router = express.Router();

const controller = require("./users.controller");
const { authenticate } = require("../../middleware/auth");
const {
  uploadAvatar,
  verifyImageSignature,
  handleUploadError,
} = require("../../middleware/upload");
const validate = require("../../middleware/validate");

const {
  updateProfileValidator,
  usernameValidator,
} = require("./users.validators");

router.use(authenticate);

// PATCH /api/v1/users/me — update own profile (avatar optional)
router.patch(
  "/me",
  uploadAvatar.single("avatar"),
  handleUploadError,
  updateProfileValidator,
  verifyImageSignature,
  validate,
  controller.updateMyProfile,
);

// DELETE /api/v1/users/me/avatar
router.delete("/me/avatar", controller.removeMyAvatar);

// GET /api/v1/users/:username — public profile lookup
router.get("/:username", usernameValidator, validate, controller.getProfile);

module.exports = router;
