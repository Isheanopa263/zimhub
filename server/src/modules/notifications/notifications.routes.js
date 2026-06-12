const express = require("express");
const router = express.Router();

const controller = require("./notifications.controller");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

router.get("/", controller.getNotifications);
router.get("/unread-count", controller.getUnreadCount);
router.patch("/read-all", controller.markAllAsRead);
router.patch("/:id/read", controller.markAsRead);
router.delete("/:id", controller.deleteNotification);

module.exports = router;
