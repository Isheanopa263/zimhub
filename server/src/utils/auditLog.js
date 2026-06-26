const { query } = require("../config/database");

/**
 * Log an admin action to the audit trail
 *
 * @param {string} adminId - UUID of admin user
 * @param {string} action - Action name (e.g. 'delete_user', 'suspend_user')
 * @param {object} target - { type: 'user'|'post'|'notice'|'comment', id: 'uuid' }
 * @param {object} details - Optional additional context
 * @param {string} ipAddress - IP of the admin
 */
const logAdminAction = async (
  adminId,
  action,
  target = {},
  details = {},
  ipAddress = null,
) => {
  try {
    await query(
      `INSERT INTO admin_audit_log
        (admin_id, action, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        adminId,
        action,
        target.type || null,
        target.id || null,
        details ? JSON.stringify(details) : null,
        ipAddress,
      ],
    );
  } catch (err) {
    // Audit logging should never break the actual operation
    console.error("Audit log failed:", err.message);
  }
};

/**
 * Get audit logs with pagination
 */
const getAuditLogs = async ({
  page = 1,
  limit = 50,
  adminId,
  action,
  targetType,
}) => {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (adminId) {
    params.push(adminId);
    conditions.push(`a.admin_id = $${params.length}`);
  }

  if (action) {
    params.push(action);
    conditions.push(`a.action = $${params.length}`);
  }

  if (targetType) {
    params.push(targetType);
    conditions.push(`a.target_type = $${params.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query(
    `SELECT COUNT(*) FROM admin_audit_log a ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
  const result = await query(
    `SELECT
       a.id, a.action, a.target_type, a.target_id,
       a.details, a.ip_address, a.created_at,
       u.username AS admin_username,
       p.full_name AS admin_name
     FROM admin_audit_log a
     LEFT JOIN users u ON u.id = a.admin_id
     LEFT JOIN profiles p ON p.user_id = a.admin_id
     ${whereClause}
     ORDER BY a.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return {
    logs: result.rows,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  };
};

module.exports = { logAdminAction, getAuditLogs };
