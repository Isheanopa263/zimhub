const adminService = require("./admin.service");
const postsService = require("../posts/posts.service");
const noticesService = require("../notices/notices.service");
const ApiResponse = require("../../utils/ApiResponse");

/* ── Dashboard ── */
const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return ApiResponse.success(res, "Dashboard data loaded", stats);
  } catch (error) {
    next(error);
  }
};

/* ── Users ── */
const getUsers = async (req, res, next) => {
  try {
    const result = await adminService.getUsers({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search || "",
      role: req.query.role || "all",
      status: req.query.status || "all",
    });
    return ApiResponse.success(res, "Users loaded", result.users, result.meta);
  } catch (error) {
    next(error);
  }
};

const toggleSuspension = async (req, res, next) => {
  try {
    const result = await adminService.toggleSuspension(
      req.params.id,
      req.user.id,
    );
    return ApiResponse.success(
      res,
      result.isSuspended ? "User suspended" : "User unsuspended",
      result,
    );
  } catch (error) {
    next(error);
  }
};

const changeUserRole = async (req, res, next) => {
  try {
    const result = await adminService.changeUserRole(
      req.params.id,
      req.user.id,
      req.body.role,
    );
    return ApiResponse.success(
      res,
      `User role changed to ${result.role}`,
      result,
    );
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(req.params.id, req.user.id);
    return ApiResponse.success(res, "User and all their content deleted");
  } catch (error) {
    next(error);
  }
};

/* ── Posts Moderation ── */
const getAllPosts = async (req, res, next) => {
  try {
    const result = await adminService.getAllPostsForModeration({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      includeDeleted: req.query.includeDeleted === "true",
    });
    return ApiResponse.success(res, "Posts loaded", result.posts, result.meta);
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    await postsService.deletePost(req.params.id, req.user.id, true);
    return ApiResponse.success(res, "Post deleted");
  } catch (error) {
    next(error);
  }
};

/* ── Notices Moderation ── */
const getAllNotices = async (req, res, next) => {
  try {
    const result = await adminService.getAllNoticesForModeration({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    });
    return ApiResponse.success(
      res,
      "Notices loaded",
      result.notices,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    await noticesService.deleteNotice(req.params.id, req.user.id, true);
    return ApiResponse.success(res, "Notice deleted");
  } catch (error) {
    next(error);
  }
};

/* ── Announcements ── */
const getAnnouncements = async (req, res, next) => {
  try {
    const result = await adminService.getAllAnnouncements({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    });
    return ApiResponse.success(
      res,
      "Announcements loaded",
      result.announcements,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await adminService.createAnnouncement(
      req.user.id,
      req.body,
    );
    return ApiResponse.created(res, "Announcement created", announcement);
  } catch (error) {
    next(error);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await adminService.updateAnnouncement(
      req.params.id,
      req.body,
    );
    return ApiResponse.success(res, "Announcement updated", announcement);
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    await adminService.deleteAnnouncement(req.params.id);
    return ApiResponse.success(res, "Announcement deleted");
  } catch (error) {
    next(error);
  }
};

const broadcastAnnouncement = async (req, res, next) => {
  try {
    const result = await adminService.broadcastAnnouncement(req.params.id);
    return ApiResponse.success(
      res,
      `Announcement sent to ${result.recipientCount} users`,
      result,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getUsers,
  toggleSuspension,
  changeUserRole,
  deleteUser,
  getAllPosts,
  deletePost,
  getAllNotices,
  deleteNotice,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  broadcastAnnouncement,
};
