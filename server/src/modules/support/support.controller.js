const supportService = require("./support.service");
const ApiResponse = require("../../utils/ApiResponse");

/* ═══ QUERIES (User-facing) ═══ */

const createQuery = async (req, res, next) => {
  try {
    const query = await supportService.createQuery(req.user.id, req.body);
    return ApiResponse.created(res, "Query submitted successfully", query);
  } catch (error) {
    next(error);
  }
};

const getMyQueries = async (req, res, next) => {
  try {
    const result = await supportService.getUserQueries(req.user.id, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
    });
    return ApiResponse.success(
      res,
      "Queries loaded",
      result.queries,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

const getMyQuery = async (req, res, next) => {
  try {
    const query = await supportService.getQueryById(
      req.params.id,
      req.user.id,
      false,
    );
    return ApiResponse.success(res, "Query loaded", query);
  } catch (error) {
    next(error);
  }
};

const replyToMyQuery = async (req, res, next) => {
  try {
    const reply = await supportService.addReply(
      req.params.id,
      req.user.id,
      req.body.message,
      false,
    );
    return ApiResponse.created(res, "Reply sent", reply);
  } catch (error) {
    next(error);
  }
};

const getMyUnreadCount = async (req, res, next) => {
  try {
    const count = await supportService.getUnreadCount(req.user.id);
    return ApiResponse.success(res, "Unread count", { count });
  } catch (error) {
    next(error);
  }
};

/* ═══ SUGGESTIONS (User-facing — anonymous) ═══ */

const createSuggestion = async (req, res, next) => {
  try {
    // Get the real IP (works with proxies)
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      req.connection?.remoteAddress ||
      req.ip;

    const result = await supportService.createSuggestion({
      ...req.body,
      ipAddress: ip,
    });
    return ApiResponse.created(res, result.message, { id: result.id });
  } catch (error) {
    next(error);
  }
};

/* ═══ ADMIN ROUTES ═══ */

const getAllQueriesAdmin = async (req, res, next) => {
  try {
    const result = await supportService.getAllQueries({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      priority: req.query.priority,
      search: req.query.search,
    });
    return ApiResponse.success(
      res,
      "Queries loaded",
      result.queries,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

const getQueryAdmin = async (req, res, next) => {
  try {
    const query = await supportService.getQueryById(
      req.params.id,
      req.user.id,
      true,
    );
    return ApiResponse.success(res, "Query loaded", query);
  } catch (error) {
    next(error);
  }
};

const replyToQueryAdmin = async (req, res, next) => {
  try {
    const reply = await supportService.addReply(
      req.params.id,
      req.user.id,
      req.body.message,
      true,
    );
    return ApiResponse.created(res, "Reply sent", reply);
  } catch (error) {
    next(error);
  }
};

const updateQueryAdmin = async (req, res, next) => {
  try {
    const updated = await supportService.updateQueryStatus(
      req.params.id,
      req.body.status,
      req.body.priority,
    );
    return ApiResponse.success(res, "Query updated", updated);
  } catch (error) {
    next(error);
  }
};

const getAdminUnreadCount = async (req, res, next) => {
  try {
    const count = await supportService.getAdminUnreadCount();
    return ApiResponse.success(res, "Unread count", { count });
  } catch (error) {
    next(error);
  }
};

/* ═══ SUGGESTIONS (Admin) ═══ */

const getSuggestionsAdmin = async (req, res, next) => {
  try {
    const result = await supportService.getSuggestions({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 30,
      category: req.query.category,
      isRead:
        req.query.isRead === "true"
          ? true
          : req.query.isRead === "false"
            ? false
            : undefined,
      isArchived:
        req.query.isArchived === "true"
          ? true
          : req.query.isArchived === "false"
            ? false
            : undefined,
    });
    return ApiResponse.success(
      res,
      "Suggestions loaded",
      result.suggestions,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

const markSuggestionRead = async (req, res, next) => {
  try {
    const isRead = req.body.isRead !== false;
    const result = await supportService.markSuggestionRead(
      req.params.id,
      isRead,
    );
    return ApiResponse.success(
      res,
      `Marked as ${isRead ? "read" : "unread"}`,
      result,
    );
  } catch (error) {
    next(error);
  }
};

const archiveSuggestion = async (req, res, next) => {
  try {
    const isArchived = req.body.isArchived !== false;
    const result = await supportService.archiveSuggestion(
      req.params.id,
      isArchived,
    );
    return ApiResponse.success(
      res,
      `${isArchived ? "Archived" : "Unarchived"}`,
      result,
    );
  } catch (error) {
    next(error);
  }
};

const deleteSuggestion = async (req, res, next) => {
  try {
    await supportService.deleteSuggestion(req.params.id);
    return ApiResponse.success(res, "Suggestion deleted");
  } catch (error) {
    next(error);
  }
};

const getSuggestionStats = async (req, res, next) => {
  try {
    const stats = await supportService.getSuggestionStats();
    return ApiResponse.success(res, "Stats loaded", stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Queries (user)
  createQuery,
  getMyQueries,
  getMyQuery,
  replyToMyQuery,
  getMyUnreadCount,

  // Suggestions (user)
  createSuggestion,

  // Admin queries
  getAllQueriesAdmin,
  getQueryAdmin,
  replyToQueryAdmin,
  updateQueryAdmin,
  getAdminUnreadCount,

  // Admin suggestions
  getSuggestionsAdmin,
  markSuggestionRead,
  archiveSuggestion,
  deleteSuggestion,
  getSuggestionStats,
};
