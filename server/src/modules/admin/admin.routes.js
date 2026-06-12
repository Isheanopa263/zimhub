const express = require("express");
const router = express.Router();
const { param, body } = require("express-validator");

const controller = require("./admin.controller");
const { authenticate, requireAdmin } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

// ALL routes require admin
router.use(authenticate);
router.use(requireAdmin);

const idParam = [param("id").isUUID().withMessage("Invalid ID")];

// ── Dashboard ──────────────────────────────────────────────
router.get("/dashboard", controller.getDashboard);

// ── Users ──────────────────────────────────────────────────
router.get("/users", controller.getUsers);
router.patch(
  "/users/:id/toggle-suspension",
  idParam,
  validate,
  controller.toggleSuspension,
);
router.patch(
  "/users/:id/role",
  idParam,
  body("role").isIn(["admin", "student"]).withMessage("Invalid role"),
  validate,
  controller.changeUserRole,
);
router.delete("/users/:id", idParam, validate, controller.deleteUser);

// ── Posts Moderation ───────────────────────────────────────
router.get("/posts", controller.getAllPosts);
router.delete("/posts/:id", idParam, validate, controller.deletePost);

// ── Notices Moderation ─────────────────────────────────────
router.get("/notices", controller.getAllNotices);
router.delete("/notices/:id", idParam, validate, controller.deleteNotice);

// ── Announcements ──────────────────────────────────────────
router.get("/announcements", controller.getAnnouncements);
router.post(
  "/announcements",
  body("title").trim().notEmpty().isLength({ max: 255 }),
  body("content").trim().notEmpty().isLength({ max: 2000 }),
  validate,
  controller.createAnnouncement,
);
router.patch(
  "/announcements/:id",
  idParam,
  body("title").optional().trim().isLength({ max: 255 }),
  body("content").optional().trim().isLength({ max: 2000 }),
  body("isActive").optional().isBoolean(),
  validate,
  controller.updateAnnouncement,
);
router.delete(
  "/announcements/:id",
  idParam,
  validate,
  controller.deleteAnnouncement,
);
router.post(
  "/announcements/:id/broadcast",
  idParam,
  validate,
  controller.broadcastAnnouncement,
);

module.exports = router;
