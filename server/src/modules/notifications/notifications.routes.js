const express = require("express");
const router = express.Router();

const controller = require("./notifications.controller");
const { authenticate } = require("../../middleware/auth");
const { readLimiter } = require("../../middleware/rateLimiter");

router.use(authenticate);

// GET /api/v1/notifications
router.get("/", controller.getNotifications);

// GET /api/v1/notifications/unread-count
router.get("/unread-count", readLimiter, controller.getUnreadCount);

// GET /api/v1/notifications/poll?since=timestamp
router.get("/poll", readLimiter, controller.poll);

// PATCH /api/v1/notifications/read-all
router.patch("/read-all", controller.markAllAsRead);

// PATCH /api/v1/notifications/:id/read
router.patch("/:id/read", controller.markAsRead);

// DELETE /api/v1/notifications/clear-read
router.delete("/clear-read", controller.clearRead);

// DELETE /api/v1/notifications/:id
router.delete("/:id", controller.deleteNotification);

module.exports = router;
