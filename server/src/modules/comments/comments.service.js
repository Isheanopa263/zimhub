const { query, getClient } = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { getFileUrl } = require("../../utils/storage");
const { getPaginationMeta } = require("../../utils/helpers");
const notificationsService = require("../notifications/notifications.service");

/**
 * Create a comment OR reply
 * @param {string} postId
 * @param {string} userId
 * @param {string} content
 * @param {string|null} parentCommentId - if set, it's a reply
 */
const createComment = async (
  postId,
  userId,
  content,
  parentCommentId = null,
) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Verify post exists and get author
    const postResult = await client.query(
      `SELECT id, user_id AS author_id FROM posts
       WHERE id = $1 AND is_deleted = false`,
      [postId],
    );

    if (postResult.rows.length === 0) {
      throw ApiError.notFound("Post not found");
    }

    const post = postResult.rows[0];

    // If it's a reply — validate parent comment exists & belongs to same post
    let parentComment = null;
    if (parentCommentId) {
      const parentResult = await client.query(
        `SELECT id, user_id, post_id, parent_comment_id 
         FROM comments 
         WHERE id = $1 AND is_deleted = false`,
        [parentCommentId],
      );

      if (parentResult.rows.length === 0) {
        throw ApiError.notFound("Parent comment not found");
      }

      parentComment = parentResult.rows[0];

      if (parentComment.post_id !== postId) {
        throw ApiError.badRequest("Comment does not belong to this post");
      }

      // Enforce 1-level nesting — replies cannot have replies
      // If parent is itself a reply, attach to the original parent instead
      if (parentComment.parent_comment_id) {
        parentCommentId = parentComment.parent_comment_id;
      }
    }

    // Get commenter info
    const commenterResult = await client.query(
      `SELECT pr.full_name FROM profiles pr WHERE pr.user_id = $1`,
      [userId],
    );
    const commenterName = commenterResult.rows[0]?.full_name || "Someone";

    // Create comment
    const commentResult = await client.query(
      `INSERT INTO comments (user_id, post_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [userId, postId, content.trim(), parentCommentId],
    );

    const commentId = commentResult.rows[0].id;

    // Notifications
    if (parentCommentId && parentComment.user_id !== userId) {
      // Reply notification — notify the original commenter
      await notificationsService.createNotification({
        userId: parentComment.user_id,
        type: "new_comment",
        title: "New reply to your comment",
        message: `${commenterName} replied: "${content.substring(0, 60)}${content.length > 60 ? "..." : ""}"`,
        referenceId: postId,
        referenceType: "post",
      });
    } else if (!parentCommentId && post.author_id !== userId) {
      // Top-level comment — notify post author
      await notificationsService.createNotification({
        userId: post.author_id,
        type: "new_comment",
        title: "New comment on your post",
        message: `${commenterName} commented: "${content.substring(0, 60)}${content.length > 60 ? "..." : ""}"`,
        referenceId: postId,
        referenceType: "post",
      });
    }

    await client.query("COMMIT");

    return await getCommentById(commentId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get single comment by ID with reply count
 */
const getCommentById = async (commentId) => {
  const result = await query(
    `SELECT 
        c.id, c.content, c.created_at, c.updated_at, 
        c.parent_comment_id, c.is_deleted,
        u.id AS user_id, u.username,
        p.full_name, p.avatar_url,
        COALESCE(rc.reply_count, 0)::int AS reply_count
     FROM comments c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN profiles p ON p.user_id = c.user_id
     LEFT JOIN (
       SELECT parent_comment_id, COUNT(*) AS reply_count
       FROM comments
       WHERE is_deleted = false AND parent_comment_id IS NOT NULL
       GROUP BY parent_comment_id
     ) rc ON rc.parent_comment_id = c.id
     WHERE c.id = $1`,
    [commentId],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Comment not found");
  }

  return formatComment(result.rows[0]);
};

/**
 * Get top-level comments for a post (with reply counts)
 */
const getPostComments = async (postId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  // Verify post exists
  const postCheck = await query(
    `SELECT id FROM posts WHERE id = $1 AND is_deleted = false`,
    [postId],
  );
  if (postCheck.rows.length === 0) {
    throw ApiError.notFound("Post not found");
  }

  // Count top-level comments only
  const countResult = await query(
    `SELECT COUNT(*) FROM comments 
     WHERE post_id = $1 AND is_deleted = false 
       AND parent_comment_id IS NULL`,
    [postId],
  );
  const total = parseInt(countResult.rows[0].count);

  // Get top-level comments with reply counts
  const result = await query(
    `SELECT 
        c.id, c.content, c.created_at, c.updated_at,
        c.parent_comment_id,
        u.id AS user_id, u.username,
        p.full_name, p.avatar_url,
        COALESCE(rc.reply_count, 0)::int AS reply_count
     FROM comments c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN profiles p ON p.user_id = c.user_id
     LEFT JOIN (
       SELECT parent_comment_id, COUNT(*) AS reply_count
       FROM comments
       WHERE is_deleted = false
       GROUP BY parent_comment_id
     ) rc ON rc.parent_comment_id = c.id
     WHERE c.post_id = $1 
       AND c.is_deleted = false
       AND c.parent_comment_id IS NULL
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [postId, limit, offset],
  );

  return {
    comments: result.rows.map(formatComment),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Get all replies for a parent comment
 */
const getCommentReplies = async (parentCommentId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  // Verify parent exists
  const parentCheck = await query(
    `SELECT id, post_id FROM comments 
     WHERE id = $1 AND is_deleted = false`,
    [parentCommentId],
  );
  if (parentCheck.rows.length === 0) {
    throw ApiError.notFound("Comment not found");
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM comments 
     WHERE parent_comment_id = $1 AND is_deleted = false`,
    [parentCommentId],
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT 
        c.id, c.content, c.created_at, c.updated_at, c.parent_comment_id,
        u.id AS user_id, u.username,
        p.full_name, p.avatar_url
     FROM comments c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN profiles p ON p.user_id = c.user_id
     WHERE c.parent_comment_id = $1 AND c.is_deleted = false
     ORDER BY c.created_at ASC
     LIMIT $2 OFFSET $3`,
    [parentCommentId, limit, offset],
  );

  return {
    replies: result.rows.map(formatComment),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Delete a comment (soft delete)
 * Also soft-deletes all replies
 */
const deleteComment = async (commentId, userId, isAdmin = false) => {
  const result = await query(
    `SELECT user_id, post_id, parent_comment_id 
     FROM comments WHERE id = $1 AND is_deleted = false`,
    [commentId],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Comment not found");
  }

  if (result.rows[0].user_id !== userId && !isAdmin) {
    throw ApiError.forbidden("You can only delete your own comments");
  }

  // Soft delete this comment AND all its replies
  await query(
    `UPDATE comments SET is_deleted = true 
     WHERE id = $1 OR parent_comment_id = $1`,
    [commentId],
  );

  return {
    deleted: true,
    postId: result.rows[0].post_id,
    wasReply: !!result.rows[0].parent_comment_id,
    parentCommentId: result.rows[0].parent_comment_id,
  };
};

/**
 * Format comment row
 */
const formatComment = (row) => ({
  id: row.id,
  content: row.content,
  parentCommentId: row.parent_comment_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  replyCount: row.reply_count || 0,
  author: {
    id: row.user_id,
    username: row.username,
    fullName: row.full_name,
    avatarUrl: row.avatar_url ? getFileUrl(row.avatar_url, "avatars") : null,
  },
});

module.exports = {
  createComment,
  getCommentById,
  getPostComments,
  getCommentReplies,
  deleteComment,
};
