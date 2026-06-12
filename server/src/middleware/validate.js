const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * Middleware to check express-validator results
 * Run this AFTER your validator array in the route
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return next(ApiError.badRequest("Validation failed", formattedErrors));
  }

  next();
};

module.exports = validate;
