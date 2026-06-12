const notificationsService = require("./notifications.service");
const ApiResponse = require("../../utils/ApiResponse");

const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await notificationsService.getUserNotifications(
      req.user.id,
      { page, limit },
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
    await notificationsService.markAllAsRead(req.user.id);
    return ApiResponse.success(res, "All marked as read");
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

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
