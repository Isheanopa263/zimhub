const ApiError = require("../utils/ApiError");

/**
 * Global error handling middleware
 * Must be registered LAST in Express middleware chain
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  if (process.env.NODE_ENV === "development") {
    console.error("🔥 Error:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }

  // Handle known ApiErrors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors.length > 0 ? err.errors : undefined,
    });
  }

  // Handle PostgreSQL unique violation
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "A record with this information already exists",
    });
  }

  // Handle PostgreSQL foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({
      success: false,
      message: "Referenced resource does not exist",
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token has expired",
    });
  }

  // Generic 500 error (don't leak details in production)
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};

/**
 * Handle 404 - Route not found
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

module.exports = { errorHandler, notFound };
