require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");

const { generalLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

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

      // Allow any ngrok URL in development
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
  }),
);

// ─── Security (Helmet with CSP disabled for dev) ──────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false, // ← CRITICAL: allow images cross-origin
    crossOriginEmbedderPolicy: false, // ← allow embedding
    crossOriginOpenerPolicy: false, // ← allow openers
    contentSecurityPolicy: false, // ← disable CSP for dev
  }),
);

// ─── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Static file serving (uploads) ────────────────────────────────────────────
// MUST come before rate limiters
app.use(
  "/uploads",
  (req, res, next) => {
    // Explicitly set headers that allow cross-origin image loading
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=3600");
    next();
  },
  express.static(path.join(__dirname, "../uploads")),
);

// ─── Rate limiting (after static files) ───────────────────────────────────────
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
app.use("/api/v1/posts", require("./modules/posts/posts.routes"));
app.use("/api/v1/likes", require("./modules/likes/likes.routes"));
app.use("/api/v1/comments", require("./modules/comments/comments.routes"));
app.use(
  "/api/v1/announcements",
  require("./modules/announcements/announcements.routes"),
);
app.use(
  "/api/v1/notifications",
  require("./modules/notifications/notifications.routes"),
);

// ─── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║          ZimHub API Server            ║
  ╠═══════════════════════════════════════╣
  ║  Status:  Running ✓                   ║
  ║  Port:    ${PORT}                        ║
  ║  Mode:    ${process.env.NODE_ENV || "development"}             ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
