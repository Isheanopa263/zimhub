const { v4: uuidv4 } = require("uuid");

/**
 * Generate a pagination meta object
 */
const getPaginationMeta = (total, page, limit) => ({
  total: parseInt(total),
  page: parseInt(page),
  limit: parseInt(limit),
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

/**
 * Parse pagination params from request query
 */
const parsePagination = (query, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(query.limit) || defaultLimit),
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Generate unique filename for uploads
 */
const generateFileName = (originalName) => {
  const ext = originalName.split(".").pop().toLowerCase();
  return `${uuidv4()}.${ext}`;
};

/**
 * Sanitize user object - remove sensitive fields
 */
const sanitizeUser = (user) => {
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

module.exports = {
  getPaginationMeta,
  parsePagination,
  generateFileName,
  sanitizeUser,
};
