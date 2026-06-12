const { query } = require("../../config/database");
const { getPaginationMeta } = require("../../utils/helpers");
const { getFileUrl } = require("../../utils/storage");

/**
 * Create a notification
 */
const createNotification = async ({
  userId,
  type,
  title,
  message,
  referenceId = null,
  referenceType = null,
}) => {
  // Don't notify yourself
  if (!userId) return null;

  try {
    const result = await query(
      `INSERT INTO notifications 
        (user_id, type, title, message, reference_id, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [userId, type, title, message, referenceId, referenceType],
    );
    return result.rows[0];
  } catch (err) {
    console.error("Notification creation failed:", err.message);
    // Don't throw - notifications are non-critical
    return null;
  }
};

/**
 * Get user's notifications with pagination
 */
const getUserNotifications = async (userId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const countResult = await query(
    "SELECT COUNT(*) FROM notifications WHERE user_id = $1",
    [userId],
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT 
        id, type, title, message, is_read,
        reference_id, reference_type, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  return {
    notifications: result.rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      referenceId: n.reference_id,
      referenceType: n.reference_type,
      createdAt: n.created_at,
    })),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Get unread count
 */
const getUnreadCount = async (userId) => {
  const result = await query(
    `SELECT COUNT(*) FROM notifications 
     WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
  return parseInt(result.rows[0].count) || 0;
};

/**
 * Mark single notification as read
 */
const markAsRead = async (notificationId, userId) => {
  await query(
    `UPDATE notifications SET is_read = true 
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId],
  );
};

/**
 * Mark all as read for user
 */
const markAllAsRead = async (userId) => {
  await query(
    `UPDATE notifications SET is_read = true 
     WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
};

/**
 * Delete notification
 */
const deleteNotification = async (notificationId, userId) => {
  await query(`DELETE FROM notifications WHERE id = $1 AND user_id = $2`, [
    notificationId,
    userId,
  ]);
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
