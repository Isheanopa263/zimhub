const rateLimit = require("express-rate-limit");

/**
 * Rate Limiter Configuration for ZimHub
 *
 * Tuned for:
 *   - 500 university students
 *   - Free tier Render (single instance)
 *   - In-memory store (resets on restart)
 *
 * Note: In-memory store is fine for single instance.
 * If you scale to multiple instances, switch to redis store:
 *   npm install rate-limit-redis
 */

// ─── General API ─────────────────────────────────────────────────────────────
// Covers all routes not explicitly limited
// 500 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// ─── Auth (Login / Register) ─────────────────────────────────────────────────
// Strict — protects against brute force
// 15 failed attempts per 15 minutes per IP+identifier
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failures

  // Track by IP + email/username combo
  // So one user's failures don't lock out another on same WiFi
  keyGenerator: (req) => {
    const ip = req.ip || "unknown";
    const identifier = (
      req.body?.identifier ||
      req.body?.email ||
      req.body?.username ||
      "no-id"
    )
      .toLowerCase()
      .trim();
    return `auth:${ip}:${identifier}`;
  },

  message: {
    success: false,
    message:
      "Too many failed attempts. Please wait 15 minutes before trying again.",
  },
});

// ─── Token Refresh ───────────────────────────────────────────────────────────
// Moderate — prevents refresh token abuse
// 30 refreshes per 15 minutes per IP
const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many token refresh attempts. Please log in again.",
  },
});

// ─── OTP Requests ────────────────────────────────────────────────────────────
// Strict — prevents OTP spam (costs money to send emails)
// 5 OTP requests per 15 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many verification code requests. Please wait before requesting another.",
  },
});

// ─── Feed / Read Endpoints ───────────────────────────────────────────────────
// Very generous — reading content should never be blocked
// 1000 requests per 15 minutes per IP
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});

// ─── Create Content (Posts / Notices) ────────────────────────────────────────
// Moderate — prevents spam posting
// 30 creations per hour per IP
const createPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "You are posting too frequently. Please wait a while.",
  },
});

// ─── File Uploads ────────────────────────────────────────────────────────────
// Moderate — uploads use bandwidth and storage
// 50 uploads per hour per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Upload limit reached. Please try again later.",
  },
});

// ─── Search ──────────────────────────────────────────────────────────────────
// Generous — search should be fast and frequent
// 200 searches per 15 minutes per IP
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

// ─── Notifications Polling ───────────────────────────────────────────────────
// Very generous — polls every 30 seconds
// 200 per 15 minutes per IP (covers 30s intervals easily)
const pollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Polling too frequently.",
  },
});

// ─── Support / Suggestions ───────────────────────────────────────────────────
// Strict for suggestions (anonymous, can be abused)
// 5 per hour per IP
const suggestionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many suggestions. Please try again in an hour.",
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  refreshTokenLimiter,
  otpLimiter,
  readLimiter,
  createPostLimiter,
  uploadLimiter,
  searchLimiter,
  pollLimiter,
  suggestionLimiter,
};
