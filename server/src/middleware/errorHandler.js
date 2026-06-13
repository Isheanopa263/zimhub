const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  // Handle known ApiErrors silently (these are expected validation errors)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors.length > 0 ? err.errors : undefined,
    });
  }

  // PostgreSQL unique violation
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "A record with this information already exists",
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({
      success: false,
      message: "Referenced resource does not exist",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ success: false, message: "Token has expired" });
  }

  // Only log unexpected errors (real bugs)
  console.error("🔥 Unexpected error:", err.message);

  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

module.exports = { errorHandler, notFound };
