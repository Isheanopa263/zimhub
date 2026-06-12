const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const { query } = require("../config/database");

/**
 * Verify JWT access token
 * Attaches decoded user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Access token required");
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Verify user still exists and is not suspended
    const result = await query(
      `SELECT id, username, email, role, is_suspended 
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

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require admin role
 * Must be used AFTER authenticate middleware
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return next(ApiError.forbidden("Admin access required"));
  }
  next();
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for public routes that behave differently when logged in
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continue without user
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const result = await query(
      "SELECT id, username, email, role FROM users WHERE id = $1",
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
