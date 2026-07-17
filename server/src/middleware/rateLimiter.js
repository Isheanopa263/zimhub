const rateLimit = require("express-rate-limit");

const sharedConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
};

const generalLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: (req) => req.path === "/health",
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 15 * 60 * 1000,
  max: 15,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Too many failed attempts. Please wait 15 minutes before trying again.",
  },
});

const refreshTokenLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many token refresh attempts. Please log in again.",
  },
});

const otpLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message:
      "Too many verification code requests. Please wait before requesting another.",
  },
});

const readLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});

const createPostLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "You are posting too frequently. Please wait a while.",
  },
});

const uploadLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Upload limit reached. Please try again later.",
  },
});

const searchLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Search limit reached. Please slow down.",
  },
});

const pollLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Polling too frequently.",
  },
});

const suggestionLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 60 * 60 * 1000,
  max: 5,
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
