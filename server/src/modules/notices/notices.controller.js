const noticesService = require("./notices.service");
const ApiResponse = require("../../utils/ApiResponse");

const createNotice = async (req, res, next) => {
  try {
    const notice = await noticesService.createNotice(
      req.user.id,
      req.body,
      req.file,
    );
    return ApiResponse.created(res, "Notice posted", notice);
  } catch (error) {
    next(error);
  }
};

const getNotice = async (req, res, next) => {
  try {
    const notice = await noticesService.getNoticeById(req.params.id);
    return ApiResponse.success(res, "Notice loaded", notice);
  } catch (error) {
    next(error);
  }
};

const getNotices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "all";
    const search = req.query.search || "";
    const mine = req.query.mine === true || req.query.mine === "true";

    const result = await noticesService.getNotices({
      page,
      limit,
      status,
      search,
      userId: req.user.id,
      mine,
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

const updateNotice = async (req, res, next) => {
  try {
    const notice = await noticesService.updateNotice(
      req.params.id,
      req.user.id,
      req.body,
      req.file,
    );
    return ApiResponse.success(res, "Notice updated", notice);
  } catch (error) {
    next(error);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const notice = await noticesService.toggleStatus(
      req.params.id,
      req.user.id,
    );
    return ApiResponse.success(
      res,
      `Notice marked as ${notice.status}`,
      notice,
    );
  } catch (error) {
    next(error);
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    await noticesService.deleteNotice(req.params.id, req.user.id, isAdmin);
    return ApiResponse.success(res, "Notice deleted");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotice,
  getNotice,
  getNotices,
  updateNotice,
  toggleStatus,
  deleteNotice,
};
