require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const path = require("path");

const { generalLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { initCleanupJobs } = require("./utils/cleanup");

const app = express();

// Trust proxy (needed when behind nginx/load balancer)
app.set("trust proxy", 1);

// Disable x-powered-by header (security + perf)
app.disable("x-powered-by");

// ─── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.NGROK_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        process.env.NODE_ENV === "development" &&
        (origin.includes("ngrok") || origin.includes("localhost"))
      ) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
    maxAge: 86400, // Cache preflight for 24h
  }),
);

// ─── Compression — huge performance win ────────────────────────────────────────
app.use(
  compression({
    level: 6, // Compression level (1-9, 6 is good balance)
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  }),
);

// ─── Security ──────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
  }),
);

// ─── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Static file serving ───────────────────────────────────────────────────────
app.use(
  "/uploads",
  (req, res, next) => {
    // Only allow specific origins instead of *
    const allowedOrigins = [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:4173",
    ].filter(Boolean);

    const origin = req.headers.origin;
    if (
      origin &&
      (allowedOrigins.includes(origin) || origin.includes("ngrok"))
    ) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (process.env.NODE_ENV !== "production") {
      // In dev, fall back to allowing
      res.setHeader("Access-Control-Allow-Origin", "*");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=2592000, immutable");

    // Prevent files from being interpreted as HTML (defense in depth)
    res.setHeader("X-Content-Type-Options", "nosniff");

    next();
  },
  express.static(path.join(__dirname, "../uploads"), {
    maxAge: "30d",
    etag: true,
  }),
);

// ─── Rate limiting ─────────────────────────────────────────────────────────────
app.use("/api/v1/auth", generalLimiter);

// ─── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    message: "ZimHub API is running ✓",
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", require("./modules/auth/auth.routes"));
app.use("/api/v1/users", require("./modules/users/users.routes"));
app.use("/api/v1/posts", require("./modules/posts/posts.routes"));
app.use("/api/v1/likes", require("./modules/likes/likes.routes"));
app.use("/api/v1/comments", require("./modules/comments/comments.routes"));
app.use("/api/v1/notices", require("./modules/notices/notices.routes"));
app.use("/api/v1/search", require("./modules/search/search.routes"));
app.use("/api/v1/admin", require("./modules/admin/admin.routes"));
app.use(
  "/api/v1/announcements",
  require("./modules/announcements/announcements.routes"),
);
app.use(
  "/api/v1/notifications",
  require("./modules/notifications/notifications.routes"),
);
app.use("/api/v1/support", require("./modules/support/support.routes"));

// ─── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Server with keep-alive optimization ──────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `\n  🚀 ZimHub API running on port ${PORT} (${process.env.NODE_ENV || "development"})\n`,
  );

  if (process.env.NODE_ENV !== "test") {
    initCleanupJobs();
  }
});

// Tune server for high concurrency
server.keepAliveTimeout = 65000; // Slightly higher than load balancer timeout
server.headersTimeout = 66000;
server.requestTimeout = 60000;

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n📦 ${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log("  ✅ HTTP server closed");
    require("./config/database").pool.end(() => {
      console.log("  ✅ Database pool closed");
      process.exit(0);
    });
  });

  // Force shutdown after 30s
  setTimeout(() => {
    console.error("  ⚠️  Forced shutdown");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = app;
