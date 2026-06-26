const crypto = require("crypto");
const { query, getClient } = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { getFileUrl } = require("../../utils/storage");
const { getPaginationMeta } = require("../../utils/helpers");
const notificationsService = require("../notifications/notifications.service");

/* ═══════════════════════════════════════════════════════════════════════════
   QUERIES (Private — User to Admin with Replies)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * User creates a new query/complaint
 */
const createQuery = async (
  userId,
  { category, subject, message, priority },
) => {
  if (!category || !subject?.trim() || !message?.trim()) {
    throw ApiError.badRequest("Category, subject and message are required");
  }

  if (subject.length > 255) {
    throw ApiError.badRequest("Subject too long (max 255 characters)");
  }

  if (message.length > 5000) {
    throw ApiError.badRequest("Message too long (max 5000 characters)");
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Create the query
    const queryResult = await client.query(
      `INSERT INTO queries (user_id, category, subject, message, priority, last_reply_at, last_reply_by)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'user')
       RETURNING id, created_at`,
      [userId, category, subject.trim(), message.trim(), priority || "normal"],
    );

    const queryId = queryResult.rows[0].id;

    // Create the initial reply (the message itself becomes the first reply in the thread)
    await client.query(
      `INSERT INTO query_replies (query_id, sender_id, sender_type, message)
       VALUES ($1, $2, 'user', $3)`,
      [queryId, userId, message.trim()],
    );

    await client.query("COMMIT");

    // Notify all admins
    const admins = await query(
      `SELECT id FROM users WHERE role = 'admin' AND is_suspended = false`,
    );

    const userInfo = await query(
      `SELECT p.full_name FROM profiles p WHERE p.user_id = $1`,
      [userId],
    );

    const userName = userInfo.rows[0]?.full_name || "A user";

    for (const admin of admins.rows) {
      await notificationsService.createNotification({
        userId: admin.id,
        type: "admin_announcement",
        title: "📨 New Support Query",
        message: `${userName} submitted: "${subject.substring(0, 80)}"`,
        referenceId: queryId,
        referenceType: "query",
      });
    }

    return await getQueryById(queryId, userId, false);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get queries for a user
 */
const getUserQueries = async (userId, { page = 1, limit = 20, status }) => {
  const offset = (page - 1) * limit;
  const params = [userId];
  let whereClause = "WHERE q.user_id = $1";

  if (status && status !== "all") {
    params.push(status);
    whereClause += ` AND q.status = $${params.length}`;
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM queries q ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
  const result = await query(
    `SELECT 
        q.id, q.category, q.subject, q.status, q.priority,
        q.last_reply_at, q.last_reply_by,
        q.created_at, q.updated_at,
        (SELECT COUNT(*) FROM query_replies WHERE query_id = q.id)::int AS reply_count,
        (SELECT COUNT(*) FROM query_replies 
          WHERE query_id = q.id 
          AND sender_type = 'admin' 
          AND is_read = false)::int AS unread_admin_replies
     FROM queries q
     ${whereClause}
     ORDER BY q.last_reply_at DESC NULLS LAST, q.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return {
    queries: result.rows.map(formatQuerySummary),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Get all queries (admin only) with filters
 */
const getAllQueries = async ({
  page = 1,
  limit = 20,
  status,
  priority,
  search,
}) => {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`q.status = $${params.length}`);
  }

  if (priority && priority !== "all") {
    params.push(priority);
    conditions.push(`q.priority = $${params.length}`);
  }

  if (search?.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(
      `(q.subject ILIKE $${params.length} OR q.message ILIKE $${params.length})`,
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query(
    `SELECT COUNT(*) FROM queries q ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
  const result = await query(
    `SELECT 
        q.id, q.category, q.subject, q.status, q.priority,
        q.last_reply_at, q.last_reply_by,
        q.created_at, q.updated_at,
        u.id AS user_id, u.username, u.email,
        p.full_name, p.avatar_url,
        (SELECT COUNT(*) FROM query_replies WHERE query_id = q.id)::int AS reply_count,
        (SELECT COUNT(*) FROM query_replies 
          WHERE query_id = q.id 
          AND sender_type = 'user' 
          AND is_read = false)::int AS unread_user_messages
     FROM queries q
     JOIN users u ON u.id = q.user_id
     LEFT JOIN profiles p ON p.user_id = q.user_id
     ${whereClause}
     ORDER BY 
       CASE q.priority 
         WHEN 'urgent' THEN 1
         WHEN 'high'   THEN 2
         WHEN 'normal' THEN 3
         WHEN 'low'    THEN 4
       END,
       q.last_reply_at DESC NULLS LAST,
       q.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return {
    queries: result.rows.map(formatQuerySummaryAdmin),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Get single query with full thread
 */
const getQueryById = async (queryId, currentUserId, isAdmin = false) => {
  const queryResult = await query(
    `SELECT 
        q.id, q.category, q.subject, q.status, q.priority,
        q.last_reply_at, q.last_reply_by, q.created_at, q.updated_at,
        u.id AS user_id, u.username, u.email,
        p.full_name, p.avatar_url
     FROM queries q
     JOIN users u ON u.id = q.user_id
     LEFT JOIN profiles p ON p.user_id = q.user_id
     WHERE q.id = $1`,
    [queryId],
  );

  if (queryResult.rows.length === 0) {
    throw ApiError.notFound("Query not found");
  }

  const q = queryResult.rows[0];

  // Permission check — only owner or admin can view
  if (!isAdmin && q.user_id !== currentUserId) {
    throw ApiError.forbidden("You can only view your own queries");
  }

  // Get all replies in chronological order
  const repliesResult = await query(
    `SELECT 
        r.id, r.sender_id, r.sender_type, r.message, r.is_read, r.created_at,
        u.username,
        p.full_name, p.avatar_url
     FROM query_replies r
     JOIN users u ON u.id = r.sender_id
     LEFT JOIN profiles p ON p.user_id = r.sender_id
     WHERE r.query_id = $1
     ORDER BY r.created_at ASC`,
    [queryId],
  );

  // Mark messages as read based on who's viewing
  if (isAdmin) {
    // Admin viewing → mark user messages as read
    await query(
      `UPDATE query_replies 
       SET is_read = true 
       WHERE query_id = $1 AND sender_type = 'user' AND is_read = false`,
      [queryId],
    );
  } else {
    // User viewing their own → mark admin replies as read
    await query(
      `UPDATE query_replies 
       SET is_read = true 
       WHERE query_id = $1 AND sender_type = 'admin' AND is_read = false`,
      [queryId],
    );
  }

  return {
    id: q.id,
    category: q.category,
    subject: q.subject,
    status: q.status,
    priority: q.priority,
    createdAt: q.created_at,
    updatedAt: q.updated_at,
    lastReplyAt: q.last_reply_at,
    lastReplyBy: q.last_reply_by,
    user: isAdmin
      ? {
          id: q.user_id,
          username: q.username,
          email: q.email,
          fullName: q.full_name,
          avatarUrl: q.avatar_url ? getFileUrl(q.avatar_url, "avatars") : null,
        }
      : null,
    replies: repliesResult.rows.map((r) => ({
      id: r.id,
      message: r.message,
      senderType: r.sender_type,
      isRead: r.is_read,
      createdAt: r.created_at,
      sender: {
        id: r.sender_id,
        username: r.username,
        fullName: r.full_name,
        avatarUrl: r.avatar_url ? getFileUrl(r.avatar_url, "avatars") : null,
      },
    })),
  };
};

/**
 * Reply to a query (user or admin)
 */
const addReply = async (queryId, senderId, message, isAdmin = false) => {
  if (!message?.trim() || message.length > 5000) {
    throw ApiError.badRequest("Message is required (max 5000 characters)");
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Check query exists
    const queryCheck = await client.query(
      `SELECT user_id, status FROM queries WHERE id = $1`,
      [queryId],
    );

    if (queryCheck.rows.length === 0) {
      throw ApiError.notFound("Query not found");
    }

    const query_ = queryCheck.rows[0];

    // Permission check
    if (!isAdmin && query_.user_id !== senderId) {
      throw ApiError.forbidden("You can only reply to your own queries");
    }

    // Can't reply to closed queries
    if (query_.status === "closed") {
      throw ApiError.badRequest(
        "This query is closed. Please create a new one.",
      );
    }

    const senderType = isAdmin ? "admin" : "user";

    // Add reply
    const replyResult = await client.query(
      `INSERT INTO query_replies (query_id, sender_id, sender_type, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [queryId, senderId, senderType, message.trim()],
    );

    // Update query's last_reply tracking
    let newStatus = query_.status;
    if (isAdmin && query_.status === "open") {
      newStatus = "in_progress";
    }

    await client.query(
      `UPDATE queries 
       SET last_reply_at = NOW(), last_reply_by = $1, status = $2
       WHERE id = $3`,
      [senderType, newStatus, queryId],
    );

    await client.query("COMMIT");

    // Send notifications
    if (isAdmin) {
      // Admin replied → notify the user
      const senderInfo = await query(
        `SELECT p.full_name FROM profiles p WHERE p.user_id = $1`,
        [senderId],
      );
      const adminName = senderInfo.rows[0]?.full_name || "Admin";

      await notificationsService.createNotification({
        userId: query_.user_id,
        type: "admin_announcement",
        title: "💬 Admin replied to your query",
        message: `${adminName}: "${message.substring(0, 80)}${message.length > 80 ? "..." : ""}"`,
        referenceId: queryId,
        referenceType: "query",
      });
    } else {
      // User replied → notify all admins
      const admins = await query(
        `SELECT id FROM users WHERE role = 'admin' AND is_suspended = false`,
      );

      const senderInfo = await query(
        `SELECT p.full_name FROM profiles p WHERE p.user_id = $1`,
        [senderId],
      );
      const userName = senderInfo.rows[0]?.full_name || "User";

      for (const admin of admins.rows) {
        await notificationsService.createNotification({
          userId: admin.id,
          type: "admin_announcement",
          title: "📨 New reply to query",
          message: `${userName}: "${message.substring(0, 80)}${message.length > 80 ? "..." : ""}"`,
          referenceId: queryId,
          referenceType: "query",
        });
      }
    }

    return {
      id: replyResult.rows[0].id,
      createdAt: replyResult.rows[0].created_at,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update query status (admin only)
 */
const updateQueryStatus = async (queryId, status, priority = null) => {
  const validStatuses = ["open", "in_progress", "resolved", "closed"];
  const validPriorities = ["low", "normal", "high", "urgent"];

  if (status && !validStatuses.includes(status)) {
    throw ApiError.badRequest("Invalid status");
  }

  if (priority && !validPriorities.includes(priority)) {
    throw ApiError.badRequest("Invalid priority");
  }

  const updates = [];
  const params = [];

  if (status) {
    params.push(status);
    updates.push(`status = $${params.length}`);
  }

  if (priority) {
    params.push(priority);
    updates.push(`priority = $${params.length}`);
  }

  if (updates.length === 0) {
    throw ApiError.badRequest("Nothing to update");
  }

  params.push(queryId);
  const result = await query(
    `UPDATE queries SET ${updates.join(", ")} 
     WHERE id = $${params.length}
     RETURNING id, status, priority`,
    params,
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Query not found");
  }

  return result.rows[0];
};

/**
 * Get user's unread query count
 */
const getUnreadCount = async (userId) => {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM query_replies r
     JOIN queries q ON q.id = r.query_id
     WHERE q.user_id = $1
       AND r.sender_type = 'admin'
       AND r.is_read = false`,
    [userId],
  );
  return result.rows[0].count;
};

/**
 * Get admin's unread count (across all queries)
 */
const getAdminUnreadCount = async () => {
  const result = await query(
    `SELECT COUNT(*)::int AS count
     FROM query_replies
     WHERE sender_type = 'user' AND is_read = false`,
  );
  return result.rows[0].count;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SUGGESTIONS (Anonymous — Read Only by Admins)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Create an anonymous suggestion
 * IP is hashed for rate limiting only — cannot identify the user
 */
const createSuggestion = async ({ category, content, ipAddress }) => {
  if (!content?.trim() || content.length > 2000) {
    throw ApiError.badRequest("Content is required (max 2000 characters)");
  }

  const validCategories = [
    "feature_idea",
    "improvement",
    "feedback",
    "general",
  ];
  if (!validCategories.includes(category)) {
    throw ApiError.badRequest("Invalid category");
  }

  // Hash IP for rate limiting (one-way, can't be reversed)
  const ipHash = ipAddress
    ? crypto
        .createHash("sha256")
        .update(ipAddress + (process.env.JWT_ACCESS_SECRET || ""))
        .digest("hex")
    : null;

  // Rate limit: max 3 suggestions per IP per hour
  if (ipHash) {
    const recent = await query(
      `SELECT COUNT(*)::int AS count
       FROM suggestions
       WHERE ip_hash = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [ipHash],
    );

    if (recent.rows[0].count >= 3) {
      throw ApiError.badRequest(
        "Too many suggestions. Please try again later.",
      );
    }
  }

  const result = await query(
    `INSERT INTO suggestions (category, content, ip_hash)
     VALUES ($1, $2, $3)
     RETURNING id, created_at`,
    [category, content.trim(), ipHash],
  );

  return {
    id: result.rows[0].id,
    createdAt: result.rows[0].created_at,
    message: "Thank you for your suggestion!",
  };
};

/**
 * Get all suggestions (admin only)
 */
const getSuggestions = async ({
  page = 1,
  limit = 30,
  category,
  isRead,
  isArchived,
}) => {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (category && category !== "all") {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  if (isRead === true || isRead === false) {
    params.push(isRead);
    conditions.push(`is_read = $${params.length}`);
  }

  // Default: hide archived unless explicitly requested
  if (isArchived === true) {
    conditions.push(`is_archived = true`);
  } else if (isArchived === false || isArchived === undefined) {
    conditions.push(`is_archived = false`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query(
    `SELECT COUNT(*) FROM suggestions ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
  const result = await query(
    `SELECT id, category, content, is_read, is_archived, created_at
     FROM suggestions
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return {
    suggestions: result.rows.map((s) => ({
      id: s.id,
      category: s.category,
      content: s.content,
      isRead: s.is_read,
      isArchived: s.is_archived,
      createdAt: s.created_at,
    })),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Mark suggestion as read/unread (admin)
 */
const markSuggestionRead = async (id, isRead = true) => {
  const result = await query(
    `UPDATE suggestions SET is_read = $1 
     WHERE id = $2 
     RETURNING id, is_read`,
    [isRead, id],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Suggestion not found");
  }

  return result.rows[0];
};

/**
 * Archive suggestion (admin) — soft delete
 */
const archiveSuggestion = async (id, isArchived = true) => {
  const result = await query(
    `UPDATE suggestions SET is_archived = $1 
     WHERE id = $2 
     RETURNING id, is_archived`,
    [isArchived, id],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Suggestion not found");
  }

  return result.rows[0];
};

/**
 * Delete suggestion (admin) — hard delete
 */
const deleteSuggestion = async (id) => {
  const result = await query(
    `DELETE FROM suggestions WHERE id = $1 RETURNING id`,
    [id],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Suggestion not found");
  }

  return { deleted: true };
};

/**
 * Get suggestion stats (admin)
 */
const getSuggestionStats = async () => {
  const result = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE is_read = false AND is_archived = false)::int AS unread,
       COUNT(*) FILTER (WHERE is_archived = true)::int AS archived,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS this_week
     FROM suggestions`,
  );

  return result.rows[0];
};

/* ═══════════════════════════════════════════════════════════════════════════
   FORMATTERS
   ═══════════════════════════════════════════════════════════════════════════ */

const formatQuerySummary = (q) => ({
  id: q.id,
  category: q.category,
  subject: q.subject,
  status: q.status,
  priority: q.priority,
  replyCount: q.reply_count || 0,
  unreadAdminReplies: q.unread_admin_replies || 0,
  lastReplyAt: q.last_reply_at,
  lastReplyBy: q.last_reply_by,
  createdAt: q.created_at,
  updatedAt: q.updated_at,
});

const formatQuerySummaryAdmin = (q) => ({
  ...formatQuerySummary(q),
  unreadUserMessages: q.unread_user_messages || 0,
  user: {
    id: q.user_id,
    username: q.username,
    email: q.email,
    fullName: q.full_name,
    avatarUrl: q.avatar_url ? getFileUrl(q.avatar_url, "avatars") : null,
  },
});

module.exports = {
  // Queries
  createQuery,
  getUserQueries,
  getAllQueries,
  getQueryById,
  addReply,
  updateQueryStatus,
  getUnreadCount,
  getAdminUnreadCount,

  // Suggestions
  createSuggestion,
  getSuggestions,
  markSuggestionRead,
  archiveSuggestion,
  deleteSuggestion,
  getSuggestionStats,
};
