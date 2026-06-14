const { query, getClient } = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { getFileUrl, deleteFile } = require("../../utils/storage");
const { getPaginationMeta } = require("../../utils/helpers");
const { remember, invalidate } = require("../../utils/cache");

/* ─── DASHBOARD STATISTICS ───────────────────────────────────────────────── */

/**
 * Get comprehensive dashboard stats
 */
const getDashboardStats = async () => {
  // Run all counts in parallel
  return remember("admin:dashboard", 30, async () => {
    const [
      usersResult,
      postsResult,
      noticesResult,
      commentsResult,
      likesResult,
      recentUsersResult,
      recentActivityResult,
      postsByTypeResult,
      growthResult,
    ] = await Promise.all([
      // Total users + breakdown
      query(`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE role = 'admin')::int AS admins,
        COUNT(*) FILTER (WHERE role = 'student')::int AS students,
        COUNT(*) FILTER (WHERE is_suspended = true)::int AS suspended,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_this_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS new_this_month
      FROM users
    `),

      // Total posts
      query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_deleted = false)::int AS active,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days' AND is_deleted = false)::int AS this_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours' AND is_deleted = false)::int AS today
      FROM posts
    `),

      // Total notices
      query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE status = 'closed')::int AS closed,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS this_week
      FROM notices
    `),

      // Comments
      query(`
      SELECT
        COUNT(*) FILTER (WHERE is_deleted = false)::int AS active,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours' AND is_deleted = false)::int AS today
      FROM comments
    `),

      // Likes
      query(`SELECT COUNT(*)::int AS total FROM likes`),

      // Recent users (last 5)
      query(`
      SELECT 
        u.id, u.username, u.role, u.created_at, u.is_suspended,
        p.full_name, p.avatar_url
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 5
    `),

      // Recent activity feed (last 10 events)
      query(`
      (
        SELECT 'post' AS type, p.id, p.created_at,
               u.username, pr.full_name,
               p.post_type AS detail
        FROM posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN profiles pr ON pr.user_id = p.user_id
        WHERE p.is_deleted = false
        ORDER BY p.created_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 'notice' AS type, n.id, n.created_at,
               u.username, pr.full_name,
               n.title AS detail
        FROM notices n
        JOIN users u ON u.id = n.user_id
        LEFT JOIN profiles pr ON pr.user_id = n.user_id
        ORDER BY n.created_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 'user' AS type, u.id, u.created_at,
               u.username, pr.full_name,
               'joined' AS detail
        FROM users u
        LEFT JOIN profiles pr ON pr.user_id = u.id
        ORDER BY u.created_at DESC
        LIMIT 5
      )
      ORDER BY created_at DESC
      LIMIT 10
    `),

      // Posts by type breakdown
      query(`
      SELECT post_type, COUNT(*)::int AS count
      FROM posts
      WHERE is_deleted = false
      GROUP BY post_type
    `),

      // Daily growth — last 7 days
      query(`
      WITH days AS (
        SELECT generate_series(
          NOW() - INTERVAL '6 days',
          NOW(),
          '1 day'::interval
        )::date AS day
      )
      SELECT 
        days.day,
        (SELECT COUNT(*)::int FROM users WHERE DATE(created_at) = days.day) AS users,
        (SELECT COUNT(*)::int FROM posts WHERE DATE(created_at) = days.day AND is_deleted = false) AS posts
      FROM days
      ORDER BY days.day ASC
    `),
    ]);

    // Format posts by type into object
    const postTypes = postsByTypeResult.rows.reduce(
      (acc, row) => {
        acc[row.post_type] = row.count;
        return acc;
      },
      { video: 0, image: 0, text: 0, link: 0 },
    );

    // Format recent users
    const recentUsers = recentUsersResult.rows.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.full_name,
      role: u.role,
      isSuspended: u.is_suspended,
      avatarUrl: u.avatar_url ? getFileUrl(u.avatar_url, "avatars") : null,
      joinedAt: u.created_at,
    }));

    // Format activity
    const activity = recentActivityResult.rows.map((a) => ({
      type: a.type,
      id: a.id,
      username: a.username,
      fullName: a.full_name,
      detail: a.detail,
      timestamp: a.created_at,
    }));

    // Format growth chart data
    const growth = growthResult.rows.map((row) => ({
      date: row.day,
      users: row.users || 0,
      posts: row.posts || 0,
    }));

    return {
      users: usersResult.rows[0],
      posts: {
        ...postsResult.rows[0],
        byType: postTypes,
      },
      notices: noticesResult.rows[0],
      comments: commentsResult.rows[0],
      likes: likesResult.rows[0],
      recentUsers,
      recentActivity: activity,
      growth,
    };
    return {
      users,
      posts,
      notices,
      comments,
      likes,
      recentUsers,
      recentActivity,
      growth,
    };
  });
};

/* ─── USER MANAGEMENT ─────────────────────────────────────────────────────── */

/**
 * Get all users with filters
 */
const getUsers = async ({
  page = 1,
  limit = 20,
  search = "",
  role = "all",
  status = "all",
}) => {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (search?.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(
      `(u.username ILIKE $${params.length} OR p.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`,
    );
  }

  if (role && role !== "all") {
    params.push(role);
    conditions.push(`u.role = $${params.length}`);
  }

  if (status === "suspended") {
    conditions.push(`u.is_suspended = true`);
  } else if (status === "active") {
    conditions.push(`u.is_suspended = false`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count
  const countQuery = `
    SELECT COUNT(*) FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ${whereClause}
  `;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // Data
  params.push(limit, offset);
  const dataQuery = `
    SELECT 
      u.id, u.username, u.email, u.role, u.is_suspended, 
      u.is_verified, u.created_at,
      p.full_name, p.bio, p.avatar_url,
      COUNT(DISTINCT po.id) FILTER (WHERE po.is_deleted = false)::int AS post_count,
      COUNT(DISTINCT n.id)::int AS notice_count
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN posts po ON po.user_id = u.id
    LEFT JOIN notices n ON n.user_id = u.id
    ${whereClause}
    GROUP BY u.id, p.full_name, p.bio, p.avatar_url
    ORDER BY u.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const result = await query(dataQuery, params);

  return {
    users: result.rows.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      isSuspended: u.is_suspended,
      isVerified: u.is_verified,
      fullName: u.full_name,
      bio: u.bio,
      avatarUrl: u.avatar_url ? getFileUrl(u.avatar_url, "avatars") : null,
      postCount: u.post_count || 0,
      noticeCount: u.notice_count || 0,
      joinedAt: u.created_at,
    })),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Toggle user suspension
 */
const toggleSuspension = async (userId, adminId) => {
  if (userId === adminId) {
    throw ApiError.badRequest("You cannot suspend yourself");
  }

  const result = await query(
    `SELECT role, is_suspended FROM users WHERE id = $1`,
    [userId],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("User not found");
  }

  if (result.rows[0].role === "admin") {
    throw ApiError.forbidden("Cannot suspend an admin");
  }

  const newStatus = !result.rows[0].is_suspended;

  await query(`UPDATE users SET is_suspended = $1 WHERE id = $2`, [
    newStatus,
    userId,
  ]);

  // Invalidate all sessions if suspending
  if (newStatus) {
    await query(`DELETE FROM user_sessions WHERE user_id = $1`, [userId]);
  }

  return { isSuspended: newStatus };
};

/**
 * Change user role (promote/demote)
 */
const changeUserRole = async (userId, adminId, newRole) => {
  if (userId === adminId) {
    throw ApiError.badRequest("You cannot change your own role");
  }

  if (!["admin", "student"].includes(newRole)) {
    throw ApiError.badRequest("Invalid role");
  }

  const result = await query(
    `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role`,
    [newRole, userId],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("User not found");
  }

  return result.rows[0];
};

/**
 * Delete user (cascades to all their content)
 */
const deleteUser = async (userId, adminId) => {
  if (userId === adminId) {
    throw ApiError.badRequest("You cannot delete yourself");
  }

  // Get user info first
  const userResult = await query(
    `SELECT u.id, u.role, p.avatar_url FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  );

  if (userResult.rows.length === 0) {
    throw ApiError.notFound("User not found");
  }

  if (userResult.rows[0].role === "admin") {
    throw ApiError.forbidden("Cannot delete an admin");
  }

  // Get all media files to delete
  const mediaResult = await query(
    `SELECT 
      (SELECT array_agg(image_url) FROM post_images pi 
       JOIN posts p ON p.id = pi.post_id WHERE p.user_id = $1) AS images,
      (SELECT array_agg(video_url) FROM post_videos pv 
       JOIN posts p ON p.id = pv.post_id WHERE p.user_id = $1) AS videos,
      (SELECT array_agg(poster_url) FROM notices WHERE user_id = $1) AS notice_posters`,
    [userId],
  );

  const media = mediaResult.rows[0];

  // Delete files
  if (userResult.rows[0].avatar_url) {
    deleteFile(userResult.rows[0].avatar_url, "avatars");
  }
  (media.images || []).forEach((f) => f && deleteFile(f, "images"));
  (media.videos || []).forEach((f) => f && deleteFile(f, "videos"));
  (media.notice_posters || []).forEach((f) => f && deleteFile(f, "notices"));

  // Delete user (cascades to all related data)
  await query(`DELETE FROM users WHERE id = $1`, [userId]);

  return { deleted: true };
};

/* ─── CONTENT MODERATION ──────────────────────────────────────────────────── */

/**
 * Get all posts for moderation (including deleted)
 */
const getAllPostsForModeration = async ({
  page = 1,
  limit = 20,
  includeDeleted = false,
}) => {
  const offset = (page - 1) * limit;

  const whereClause = includeDeleted ? "" : "WHERE p.is_deleted = false";

  const countResult = await query(
    `SELECT COUNT(*) FROM posts p ${whereClause}`,
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT 
      p.id, p.post_type, p.caption, p.is_deleted, p.created_at,
      u.id AS user_id, u.username,
      pr.full_name, pr.avatar_url,
      pt.content AS text_content,
      pi.image_url,
      pv.video_url,
      pl.title AS link_title, pl.url AS link_url,
      COALESCE(lc.like_count, 0)::int AS like_count,
      COALESCE(cc.comment_count, 0)::int AS comment_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN profiles pr ON pr.user_id = p.user_id
    LEFT JOIN post_text_posts pt ON pt.post_id = p.id
    LEFT JOIN post_images pi ON pi.post_id = p.id
    LEFT JOIN post_videos pv ON pv.post_id = p.id
    LEFT JOIN post_links pl ON pl.post_id = p.id
    LEFT JOIN (SELECT post_id, COUNT(*) AS like_count FROM likes GROUP BY post_id) lc ON lc.post_id = p.id
    LEFT JOIN (SELECT post_id, COUNT(*) AS comment_count FROM comments WHERE is_deleted = false GROUP BY post_id) cc ON cc.post_id = p.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  return {
    posts: result.rows.map((p) => ({
      id: p.id,
      type: p.post_type,
      caption: p.caption,
      isDeleted: p.is_deleted,
      createdAt: p.created_at,
      author: {
        id: p.user_id,
        username: p.username,
        fullName: p.full_name,
        avatarUrl: p.avatar_url ? getFileUrl(p.avatar_url, "avatars") : null,
      },
      preview: {
        text: p.text_content,
        image: p.image_url ? getFileUrl(p.image_url, "images") : null,
        video: p.video_url ? getFileUrl(p.video_url, "videos") : null,
        linkTitle: p.link_title,
        linkUrl: p.link_url,
      },
      stats: {
        likes: p.like_count,
        comments: p.comment_count,
      },
    })),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Get all notices for moderation
 */
const getAllNoticesForModeration = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const countResult = await query(`SELECT COUNT(*) FROM notices`);
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT 
      n.id, n.title, n.description, n.poster_url, n.status, n.created_at,
      u.id AS user_id, u.username,
      p.full_name, p.avatar_url
    FROM notices n
    JOIN users u ON u.id = n.user_id
    LEFT JOIN profiles p ON p.user_id = n.user_id
    ORDER BY n.created_at DESC
    LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  return {
    notices: result.rows.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      posterUrl: n.poster_url ? getFileUrl(n.poster_url, "notices") : null,
      status: n.status,
      createdAt: n.created_at,
      author: {
        id: n.user_id,
        username: n.username,
        fullName: n.full_name,
        avatarUrl: n.avatar_url ? getFileUrl(n.avatar_url, "avatars") : null,
      },
    })),
    meta: getPaginationMeta(total, page, limit),
  };
};

/* ─── ANNOUNCEMENTS MANAGEMENT ────────────────────────────────────────────── */

const getAllAnnouncements = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const countResult = await query(`SELECT COUNT(*) FROM announcements`);
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT 
      a.id, a.title, a.content, a.is_active, a.created_at, a.updated_at,
      u.id AS user_id, u.username,
      p.full_name
    FROM announcements a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN profiles p ON p.user_id = a.user_id
    ORDER BY a.created_at DESC
    LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  return {
    announcements: result.rows.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      isActive: a.is_active,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      author: {
        id: a.user_id,
        username: a.username,
        fullName: a.full_name,
      },
    })),
    meta: getPaginationMeta(total, page, limit),
  };
};

const createAnnouncement = async (userId, { title, content }) => {
  if (!title?.trim() || !content?.trim()) {
    throw ApiError.badRequest("Title and content are required");
  }

  const result = await query(
    `INSERT INTO announcements (user_id, title, content)
     VALUES ($1, $2, $3)
     RETURNING id, title, content, is_active, created_at`,
    [userId, title.trim(), content.trim()],
  );

  return result.rows[0];
};

const updateAnnouncement = async (id, { title, content, isActive }) => {
  const updates = [];
  const params = [];

  if (title !== undefined) {
    params.push(title.trim());
    updates.push(`title = $${params.length}`);
  }

  if (content !== undefined) {
    params.push(content.trim());
    updates.push(`content = $${params.length}`);
  }

  if (isActive !== undefined) {
    params.push(isActive);
    updates.push(`is_active = $${params.length}`);
  }

  if (updates.length === 0) {
    throw ApiError.badRequest("No fields to update");
  }

  params.push(id);
  const result = await query(
    `UPDATE announcements SET ${updates.join(", ")} 
     WHERE id = $${params.length}
     RETURNING id, title, content, is_active, updated_at`,
    params,
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Announcement not found");
  }

  return result.rows[0];
};

const deleteAnnouncement = async (id) => {
  const result = await query(
    `DELETE FROM announcements WHERE id = $1 RETURNING id`,
    [id],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Announcement not found");
  }

  return { deleted: true };
};

const broadcastAnnouncement = async (announcementId) => {
  // Get announcement
  const a = await query(
    `SELECT title, content FROM announcements WHERE id = $1 AND is_active = true`,
    [announcementId],
  );

  if (a.rows.length === 0) {
    throw ApiError.notFound("Active announcement not found");
  }

  // Get all active users
  const users = await query(`SELECT id FROM users WHERE is_suspended = false`);

  // Create a notification for each user (batched)
  const values = users.rows
    .map((u, i) => {
      const offset = i * 6;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
    })
    .join(", ");

  const params = [];
  users.rows.forEach((u) => {
    params.push(
      u.id, // user_id
      "admin_announcement", // type
      `📢 ${a.rows[0].title}`, // title
      a.rows[0].content, // message
      announcementId, // reference_id
      "announcement", // reference_type
    );
  });

  if (users.rows.length > 0) {
    await query(
      `INSERT INTO notifications 
        (user_id, type, title, message, reference_id, reference_type)
       VALUES ${values}`,
      params,
    );
  }

  return { recipientCount: users.rows.length };
};

module.exports = {
  getDashboardStats,
  getUsers,
  toggleSuspension,
  changeUserRole,
  deleteUser,
  getAllPostsForModeration,
  getAllNoticesForModeration,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  broadcastAnnouncement,
};
