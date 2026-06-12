const searchService = require("./search.service");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");

const validateQuery = (q) => {
  if (!q || q.trim().length < 2) {
    throw ApiError.badRequest("Search query must be at least 2 characters");
  }
  return q.trim();
};

const searchAll = async (req, res, next) => {
  try {
    const q = validateQuery(req.query.q);
    const limit = parseInt(req.query.limit) || 5;
    const result = await searchService.globalSearch(q, req.user.id, limit);
    return ApiResponse.success(res, "Search results", result);
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const q = validateQuery(req.query.q);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await searchService.searchUsers(q, { page, limit });
    return ApiResponse.success(res, "Users found", result.users, result.meta);
  } catch (error) {
    next(error);
  }
};

const searchPosts = async (req, res, next) => {
  try {
    const q = validateQuery(req.query.q);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await searchService.searchPosts(q, req.user.id, {
      page,
      limit,
    });
    return ApiResponse.success(res, "Posts found", result.posts, result.meta);
  } catch (error) {
    next(error);
  }
};

const searchNotices = async (req, res, next) => {
  try {
    const q = validateQuery(req.query.q);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await searchService.searchNotices(q, { page, limit });
    return ApiResponse.success(
      res,
      "Notices found",
      result.notices,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchAll,
  searchUsers,
  searchPosts,
  searchNotices,
};
