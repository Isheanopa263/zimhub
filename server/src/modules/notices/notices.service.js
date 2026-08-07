const { query, getClient } = require("../../config/database");
const ApiError = require("../../utils/ApiError");
const { getFileUrl, deleteFile, uploadFile } = require("../../utils/storage");
const { getPaginationMeta } = require("../../utils/helpers");

const createNotice = async (userId, data, file = null) => {
  const { title, description, phoneNumber, whatsappNumber, emailAddress } =
    data;

  try {
    let posterUrl = null;
    if (file?.filename) {
      posterUrl = await uploadFile(file.filename, "notices");
    }

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

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`n.status = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(
      `(n.title ILIKE $${params.length} OR n.description ILIKE $${params.length})`,
    );
  }

  if (mine && userId) {
    params.push(userId);
    conditions.push(`n.user_id = $${params.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query(
    `SELECT COUNT(*) FROM notices n ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
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
     ${whereClause}
     ORDER BY
       CASE WHEN n.status = 'active' THEN 0 ELSE 1 END,
       n.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return {
    notices: result.rows.map(formatNotice),
    meta: getPaginationMeta(total, page, limit),
  };
};

const updateNotice = async (noticeId, userId, data, file = null) => {
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

  if (file?.filename) {
    if (existing.rows[0].poster_url) {
      deleteFile(existing.rows[0].poster_url, "notices");
    }
    const newPosterUrl = await uploadFile(file.filename, "notices");
    params.push(newPosterUrl);
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

  if (result.rows[0].poster_url) {
    deleteFile(result.rows[0].poster_url, "notices");
  }

  await query(`DELETE FROM notices WHERE id = $1`, [noticeId]);

  return { deleted: true };
};

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
