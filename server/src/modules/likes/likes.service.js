const { query, getClient } = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const notificationsService = require("../notifications/notifications.service");

/**
 * Toggle like — like if not liked, unlike if liked
 * Returns the new state and count
 */
const toggleLike = async (postId, userId) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Check if post exists and get author
    const postResult = await client.query(
      `SELECT p.id, p.user_id AS author_id,
              pr.full_name AS author_name
       FROM posts p
       LEFT JOIN profiles pr ON pr.user_id = p.user_id
       WHERE p.id = $1 AND p.is_deleted = false`,
      [postId],
    );

    if (postResult.rows.length === 0) {
      throw ApiError.notFound("Post not found");
    }

    const post = postResult.rows[0];

    // Get current liker's name for notification
    const likerResult = await client.query(
      `SELECT pr.full_name FROM profiles pr WHERE pr.user_id = $1`,
      [userId],
    );
    const likerName = likerResult.rows[0]?.full_name || "Someone";

    // Check existing like
    const existingResult = await client.query(
      `SELECT id FROM likes WHERE user_id = $1 AND post_id = $2`,
      [userId, postId],
    );

    const isLiked = existingResult.rows.length > 0;
    let action;

    if (isLiked) {
      // Unlike
      await client.query(
        `DELETE FROM likes WHERE user_id = $1 AND post_id = $2`,
        [userId, postId],
      );
      action = "unliked";
    } else {
      // Like
      await client.query(
        `INSERT INTO likes (user_id, post_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, postId],
      );
      action = "liked";

      // Create notification (only when liking, not unliking)
      // Don't notify if user likes their own post
      if (post.author_id !== userId) {
        await notificationsService.createNotification({
          userId: post.author_id,
          type: "post_liked",
          title: "New like on your post",
          message: `${likerName} liked your post`,
          referenceId: postId,
          referenceType: "post",
        });
      }
    }

    // Get new like count
    const countResult = await client.query(
      `SELECT COUNT(*)::int AS count FROM likes WHERE post_id = $1`,
      [postId],
    );

    await client.query("COMMIT");

    return {
      action,
      isLiked: action === "liked",
      likeCount: countResult.rows[0].count,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get users who liked a post (paginated)
 */
const getPostLikes = async (postId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM likes WHERE post_id = $1`,
    [postId],
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT 
        u.id, u.username,
        p.full_name, p.avatar_url,
        l.created_at AS liked_at
     FROM likes l
     JOIN users u ON u.id = l.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE l.post_id = $1
     ORDER BY l.created_at DESC
     LIMIT $2 OFFSET $3`,
    [postId, limit, offset],
  );

  const { getPaginationMeta } = require("../../utils/helpers");
  const { getFileUrl } = require("../../utils/storage");

  return {
    users: result.rows.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.full_name,
      avatarUrl: getFileUrl(u.avatar_url, "avatars"),
      likedAt: u.liked_at,
    })),
    meta: getPaginationMeta(total, page, limit),
  };
};

module.exports = { toggleLike, getPostLikes };
