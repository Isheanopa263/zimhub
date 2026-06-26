const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const controller = require("./support.controller");
const { authenticate, requireAdmin } = require("../../middleware/auth");

/* ─── Rate Limiting ─────────────────────────────────────────────────────── */

// Suggestions: 3 per IP per hour (handled in service too, but defense in depth)
const suggestionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many suggestions. Please try again in an hour.",
  },
});

// Queries: 10 per user per hour
const queryCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many queries. Please try again later.",
  },
});

// Replies: 30 per hour
const replyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many replies. Please slow down.",
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
   USER ROUTES — Queries (Authenticated)
   ═══════════════════════════════════════════════════════════════════════════ */

router.post(
  "/queries",
  authenticate,
  queryCreateLimiter,
  controller.createQuery,
);
router.get("/queries", authenticate, controller.getMyQueries);
router.get("/queries/unread-count", authenticate, controller.getMyUnreadCount);
router.get("/queries/:id", authenticate, controller.getMyQuery);
router.post(
  "/queries/:id/replies",
  authenticate,
  replyLimiter,
  controller.replyToMyQuery,
);

/* ═══════════════════════════════════════════════════════════════════════════
   ANONYMOUS — Suggestions
   ═══════════════════════════════════════════════════════════════════════════ */

// Note: still requires authenticate so we can rate limit by user but doesn't store user
router.post(
  "/suggestions",
  authenticate,
  suggestionLimiter,
  controller.createSuggestion,
);

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN ROUTES
   ═══════════════════════════════════════════════════════════════════════════ */

router.use("/admin", authenticate, requireAdmin);

// Admin Queries
router.get("/admin/queries", controller.getAllQueriesAdmin);
router.get("/admin/queries/unread-count", controller.getAdminUnreadCount);
router.get("/admin/queries/:id", controller.getQueryAdmin);
router.post(
  "/admin/queries/:id/replies",
  replyLimiter,
  controller.replyToQueryAdmin,
);
router.patch("/admin/queries/:id", controller.updateQueryAdmin);

// Admin Suggestions
router.get("/admin/suggestions", controller.getSuggestionsAdmin);
router.get("/admin/suggestions/stats", controller.getSuggestionStats);
router.patch("/admin/suggestions/:id/read", controller.markSuggestionRead);
router.patch("/admin/suggestions/:id/archive", controller.archiveSuggestion);
router.delete("/admin/suggestions/:id", controller.deleteSuggestion);

module.exports = router;
