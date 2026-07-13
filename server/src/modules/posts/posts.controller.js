const postsService = require("./posts.service");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");

const createImagePost = async (req, res, next) => {
  try {
    // req.files (plural) — array from multer.array()
    const files = req.files;

    if (!files || files.length === 0) {
      throw ApiError.badRequest("At least one image is required");
    }

    const post = await postsService.createImagePost(
      req.user.id,
      req.body.caption,
      files,
    );

    return ApiResponse.created(res, "Image post created", post);
  } catch (error) {
    next(error);
  }
};

const createVideoPost = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest("Video file is required");
    const post = await postsService.createVideoPost(
      req.user.id,
      req.body.caption,
      req.file,
    );
    return ApiResponse.created(res, "Video post created", post);
  } catch (error) {
    next(error);
  }
};

const createTextPost = async (req, res, next) => {
  try {
    const { content, backgroundStyle } = req.body;
    const post = await postsService.createTextPost(
      req.user.id,
      content,
      backgroundStyle,
    );
    return ApiResponse.created(res, "Text post created", post);
  } catch (error) {
    next(error);
  }
};

const createLinkPost = async (req, res, next) => {
  try {
    const post = await postsService.createLinkPost(req.user.id, req.body);
    return ApiResponse.created(res, "Link post created", post);
  } catch (error) {
    next(error);
  }
};

const createPollPost = async (req, res, next) => {
  try {
    const post = await postsService.createPollPost(req.user.id, req.body);
    return ApiResponse.created(res, "Poll created", post);
  } catch (error) {
    next(error);
  }
};

const votePoll = async (req, res, next) => {
  try {
    const { optionIds } = req.body;
    const post = await postsService.votePoll(
      req.params.id,
      req.user.id,
      optionIds,
    );
    return ApiResponse.success(res, "Vote recorded", post);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/posts/feed
 */
const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || "all";

    const result = await postsService.getFeedPosts(req.user.id, {
      page,
      limit,
      type,
    });
    return ApiResponse.success(res, "Feed loaded", result.posts, result.meta);
  } catch (error) {
    next(error);
  }
};

const getPost = async (req, res, next) => {
  try {
    const post = await postsService.getPostById(req.params.id, req.user.id);
    return ApiResponse.success(res, "Post loaded", post);
  } catch (error) {
    next(error);
  }
};

const getUserPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await postsService.getUserPosts(
      req.params.userId,
      req.user.id,
      { page, limit },
    );
    return ApiResponse.success(
      res,
      "User posts loaded",
      result.posts,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    await postsService.deletePost(req.params.id, req.user.id, isAdmin);
    return ApiResponse.success(res, "Post deleted");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/posts/check-new?since=timestamp
 * Returns count of new posts since timestamp
 */
const checkNewPosts = async (req, res, next) => {
  try {
    const since = req.query.since;
    if (!since) {
      return ApiResponse.success(res, "No timestamp", { count: 0 });
    }

    const { query } = require("../../config/database");
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM posts 
       WHERE is_deleted = false 
         AND created_at > $1
         AND user_id != $2`,
      [new Date(since), req.user.id],
    );

    return ApiResponse.success(res, "New posts count", {
      count: result.rows[0].count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createImagePost,
  createVideoPost,
  createTextPost,
  createLinkPost,
  createPollPost,
  votePoll,
  getFeed,
  getPost,
  getUserPosts,
  deletePost,
  checkNewPosts,
};
