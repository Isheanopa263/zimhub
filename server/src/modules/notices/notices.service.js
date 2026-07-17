const { query, getClient } = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { getFileUrl, deleteFile, uploadFile } = require("../../utils/storage");
const { getPaginationMeta } = require("../../utils/helpers");

/**
 * Create a notice
 */
const createNotice = async (userId, data, file = null) => {
  const { title, description, phoneNumber, whatsappNumber, emailAddress } =
    data;

  try {
    const posterUrl = file?.filename
      ? await uploadFile(file.filename, "notices")
      : null;
    const result = await query(
      `INSERT INTO notices (
         user_id, title, description, poster_url,
         phone_number, whatsapp_number, email_address, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING id`,
      [
        userId,
        title.trim(),
        description.trim(),
        posterUrl,
        phoneNumber || null,
        whatsappNumber || null,
        emailAddress || null,
      ],
    );

    return await getNoticeById(result.rows[0].id);
  } catch (error) {
    if (file?.filename) deleteFile(file.filename, "notices");
    throw error;
  }
};

/**
 * Get a single notice by ID
 */
const getNoticeById = async (noticeId) => {
  const result = await query(
    `SELECT 
        n.id, n.title, n.description, n.poster_url,
        n.phone_number, n.whatsapp_number, n.email_address,
        n.status, n.created_at, n.updated_at,
        u.id AS user_id, u.username,
        p.full_name, p.avatar_url
     FROM notices n
     JOIN users u ON u.id = n.user_id
     LEFT JOIN profiles p ON p.user_id = n.user_id
     WHERE n.id = $1`,
    [noticeId],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Notice not found");
  }

  return formatNotice(result.rows[0]);
};

/**
 * Get all notices with search & filters
 */
const getNotices = async ({
  page = 1,
  limit = 10,
  status = "all",
  search = "",
  userId = null,
  mine = false,
}) => {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  // Status filter
  if (status && status !== "all") {
    params.push(status);
    conditions.push(`n.status = $${params.length}`);
  }

  // Search filter (title and description)
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(
      `(n.title ILIKE $${params.length} OR n.description ILIKE $${params.length})`,
    );
  }

  // "My notices" filter
  if (mine && userId) {
    params.push(userId);
    conditions.push(`n.user_id = $${params.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count
  const countQuery = `SELECT COUNT(*) FROM notices n ${whereClause}`;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // Data
  params.push(limit, offset);
  const dataQuery = `
    SELECT 
        n.id, n.title, n.description, n.poster_url,
        n.phone_number, n.whatsapp_number, n.email_address,
        n.status, n.created_at, n.updated_at,
        u.id AS user_id, u.username,
        p.full_name, p.avatar_url
     FROM notices n
     JOIN users u ON u.id = n.user_id
     LEFT JOIN profiles p ON p.user_id = n.user_id
     ${whereClause}
     ORDER BY 
       CASE WHEN n.status = 'active' THEN 0 ELSE 1 END,
       n.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const result = await query(dataQuery, params);

  return {
    notices: result.rows.map(formatNotice),
    meta: getPaginationMeta(total, page, limit),
  };
};

/**
 * Update a notice
 */
const updateNotice = async (noticeId, userId, data, file = null) => {
  // Verify ownership
  const existing = await query(
    `SELECT user_id, poster_url FROM notices WHERE id = $1`,
    [noticeId],
  );

  if (existing.rows.length === 0) {
    throw ApiError.notFound("Notice not found");
  }

  if (existing.rows[0].user_id !== userId) {
    throw ApiError.forbidden("You can only edit your own notices");
  }

  // Build dynamic UPDATE
  const updates = [];
  const params = [];

  const fields = {
    title: data.title,
    description: data.description,
    phone_number: data.phoneNumber,
    whatsapp_number: data.whatsappNumber,
    email_address: data.emailAddress,
    status: data.status,
  };

  Object.entries(fields).forEach(([col, val]) => {
    if (val !== undefined) {
      params.push(val === "" ? null : val);
      updates.push(`${col} = $${params.length}`);
    }
  });

  // Handle new poster
  if (file?.filename) {
    // Delete old poster
    if (existing.rows[0].poster_url) {
      deleteFile(existing.rows[0].poster_url, "notices");
    }
    params.push(file.filename);
    updates.push(`poster_url = $${params.length}`);
  }

  if (updates.length === 0) {
    return await getNoticeById(noticeId);
  }

  params.push(noticeId);
  await query(
    `UPDATE notices SET ${updates.join(", ")} WHERE id = $${params.length}`,
    params,
  );

  return await getNoticeById(noticeId);
};

/**
 * Toggle status between active and closed
 */
const toggleStatus = async (noticeId, userId) => {
  const result = await query(
    `SELECT user_id, status FROM notices WHERE id = $1`,
    [noticeId],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Notice not found");
  }

  if (result.rows[0].user_id !== userId) {
    throw ApiError.forbidden("You can only update your own notices");
  }

  const newStatus = result.rows[0].status === "active" ? "closed" : "active";

  await query(`UPDATE notices SET status = $1 WHERE id = $2`, [
    newStatus,
    noticeId,
  ]);

  return await getNoticeById(noticeId);
};

/**
 * Delete a notice (hard delete)
 */
const deleteNotice = async (noticeId, userId, isAdmin = false) => {
  const result = await query(
    `SELECT user_id, poster_url FROM notices WHERE id = $1`,
    [noticeId],
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound("Notice not found");
  }

  if (result.rows[0].user_id !== userId && !isAdmin) {
    throw ApiError.forbidden("You can only delete your own notices");
  }

  // Delete poster file
  if (result.rows[0].poster_url) {
    deleteFile(result.rows[0].poster_url, "notices");
  }

  await query(`DELETE FROM notices WHERE id = $1`, [noticeId]);

  return { deleted: true };
};

/**
 * Format notice row for API response
 */
const formatNotice = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  posterUrl: row.poster_url ? getFileUrl(row.poster_url, "notices") : null,
  status: row.status,
  contact: {
    phone: row.phone_number,
    whatsapp: row.whatsapp_number,
    email: row.email_address,
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  author: {
    id: row.user_id,
    username: row.username,
    fullName: row.full_name,
    avatarUrl: row.avatar_url ? getFileUrl(row.avatar_url, "avatars") : null,
  },
});

module.exports = {
  createNotice,
  getNoticeById,
  getNotices,
  updateNotice,
  toggleStatus,
  deleteNotice,
};
