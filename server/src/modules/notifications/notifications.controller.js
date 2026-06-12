const notificationsService = require("./notifications.service");
const ApiResponse = require("../../utils/ApiResponse");

const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const result = await notificationsService.getUserNotifications(
      req.user.id,
      { page, limit, unreadOnly },
    );

    return ApiResponse.success(
      res,
      "Notifications loaded",
      result.notifications,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationsService.getUnreadCount(req.user.id);
    return ApiResponse.success(res, "Unread count", { count });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notifications/poll?since=timestamp
 * Returns notifications newer than `since` + current unread count
 * Used for real-time polling from frontend
 */
const poll = async (req, res, next) => {
  try {
    const since = req.query.since || null;
    const result = await notificationsService.getNewNotifications(
      req.user.id,
      since,
    );
    return ApiResponse.success(res, "Polled", result);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    await notificationsService.markAsRead(req.params.id, req.user.id);
    return ApiResponse.success(res, "Marked as read");
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const count = await notificationsService.markAllAsRead(req.user.id);
    return ApiResponse.success(res, `${count} notifications marked as read`, {
      count,
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await notificationsService.deleteNotification(req.params.id, req.user.id);
    return ApiResponse.success(res, "Notification deleted");
  } catch (error) {
    next(error);
  }
};

const clearRead = async (req, res, next) => {
  try {
    const count = await notificationsService.clearReadNotifications(
      req.user.id,
    );
    return ApiResponse.success(res, `${count} read notifications cleared`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  poll,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearRead,
};
