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
  actorId = null,
}) => {
  if (!userId) return null;

  try {
    const result = await query(
      `INSERT INTO notifications 
        (user_id, type, title, message, reference_id, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [userId, type, title, message, referenceId, referenceType],
    );

    return result.rows[0];
  } catch (err) {
    console.error("Notification creation failed:", err.message);
    return null;
  }
};

/**
 * Get user's notifications with pagination + actor info
 */
const getUserNotifications = async (
  userId,
  { page = 1, limit = 20, unreadOnly = false },
) => {
  const offset = (page - 1) * limit;
  const params = [userId];
  let whereClause = "WHERE n.user_id = $1";

  if (unreadOnly) {
    whereClause += " AND n.is_read = false";
  }

  // Count
  const countResult = await query(
    `SELECT COUNT(*) FROM notifications n ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count);

  // Data
  params.push(limit, offset);
  const result = await query(
    `SELECT 
        n.id, n.type, n.title, n.message, n.is_read,
        n.reference_id, n.reference_type, n.created_at
     FROM notifications n
     ${whereClause}
     ORDER BY n.is_read ASC, n.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
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
 * Get unread count (cached-friendly)
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
 * Get notifications newer than a timestamp (for polling)
 */
const getNewNotifications = async (userId, sinceTimestamp) => {
  const since = sinceTimestamp ? new Date(sinceTimestamp) : new Date(0);

  const result = await query(
    `SELECT 
        n.id, n.type, n.title, n.message, n.is_read,
        n.reference_id, n.reference_type, n.created_at
     FROM notifications n
     WHERE n.user_id = $1 AND n.created_at > $2
     ORDER BY n.created_at DESC
     LIMIT 20`,
    [userId, since],
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM notifications 
     WHERE user_id = $1 AND is_read = false`,
    [userId],
  );

  return {
    newNotifications: result.rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      referenceId: n.reference_id,
      referenceType: n.reference_type,
      createdAt: n.created_at,
    })),
    unreadCount: parseInt(countResult.rows[0].count) || 0,
    timestamp: new Date().toISOString(),
  };
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
 * Mark all as read
 */
const markAllAsRead = async (userId) => {
  const result = await query(
    `UPDATE notifications SET is_read = true 
     WHERE user_id = $1 AND is_read = false
     RETURNING id`,
    [userId],
  );
  return result.rowCount;
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

/**
 * Delete all read notifications
 */
const clearReadNotifications = async (userId) => {
  const result = await query(
    `DELETE FROM notifications 
     WHERE user_id = $1 AND is_read = true`,
    [userId],
  );
  return result.rowCount;
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  getNewNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
};
