const rateLimit = require("express-rate-limit");

/**
 * Rate limiter configs
 * Tuned for ~500 student users with normal usage patterns
 */

// ─── General API ───────────────────────────────────────────────────────────────
// 500 requests per 15 minutes per IP
// A normal user doing lots of browsing won't hit this
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // was 100, now 500
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

// ─── Auth endpoints ────────────────────────────────────────────────────────────
// 20 attempts per 15 minutes (was 10)
// Students logging in on multiple devices won't get blocked
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // was 10, now 20
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please wait 15 minutes.",
  },
});

// ─── Upload endpoints ──────────────────────────────────────────────────────────
// 50 uploads per hour (was 20)
// Students sharing content for classes won't be blocked
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // was 20, now 50
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Upload limit reached. You can upload again in an hour.",
  },
});

// ─── Feed / read endpoints ────────────────────────────────────────────────────
// Very generous — reading content should never be blocked
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Very high for feed scrolling
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});

// ─── Create post ───────────────────────────────────────────────────────────────
// 30 posts per hour per IP
const createPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "You are posting too frequently. Please wait a while.",
  },
});

// ─── Search ────────────────────────────────────────────────────────────────────
// 200 searches per 15 minutes
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Search limit reached. Please slow down.",
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  readLimiter,
  createPostLimiter,
  searchLimiter,
};
