const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const { query } = require("../config/database");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Access token required");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const result = await query(
      `SELECT id, username, role, is_suspended
       FROM users
       WHERE id = $1`,
      [decoded.userId],
    );

    if (result.rows.length === 0) {
      throw ApiError.unauthorized("User no longer exists");
    }

    const user = result.rows[0];

    if (user.is_suspended) {
      throw ApiError.forbidden("Your account has been suspended");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return next(ApiError.forbidden("Admin access required"));
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const result = await query(
      `SELECT id, username, role
       FROM users
       WHERE id = $1`,
      [decoded.userId],
    );

    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }
  } catch {
    // Silently fail for optional auth
  }
  next();
};

module.exports = { authenticate, requireAdmin, optionalAuth };
