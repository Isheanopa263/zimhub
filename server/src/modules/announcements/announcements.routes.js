const express = require("express");
const router = express.Router();
const { query } = require("../../config/database");
const { authenticate, requireAdmin } = require("../../middleware/auth");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");

/* GET /api/v1/announcements — public, active announcements */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    const result = await query(
      `SELECT 
          a.id, a.title, a.content, a.created_at,
          u.username,
          p.full_name, p.avatar_url
       FROM announcements a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN profiles p ON p.user_id = a.user_id
       WHERE a.is_active = true
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit],
    );

    return ApiResponse.success(res, "Announcements fetched", result.rows);
  } catch (error) {
    next(error);
  }
});

/* POST /api/v1/announcements — admin only */
router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      throw ApiError.badRequest("Title and content are required");
    }

    const result = await query(
      `INSERT INTO announcements (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, title.trim(), content.trim()],
    );

    return ApiResponse.created(res, "Announcement created", result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/* DELETE /api/v1/announcements/:id — admin only */
router.delete("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      "DELETE FROM announcements WHERE id = $1 RETURNING id",
      [req.params.id],
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound("Announcement not found");
    }

    return ApiResponse.success(res, "Announcement deleted");
  } catch (error) {
    next(error);
  }
});

/* GET /api/v1/notifications/unread-count */
// Temporary stub — will be replaced in Module 7
router.get("/unread-count-stub", authenticate, (req, res) => {
  return ApiResponse.success(res, "Unread count", { count: 0 });
});

module.exports = router;
