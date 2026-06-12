const postsService = require("./posts.service");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");

const createImagePost = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest("Image file is required");
    const post = await postsService.createImagePost(
      req.user.id,
      req.body.caption,
      req.file,
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

/**
 * GET /api/v1/posts/feed
 */
const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || "all";

    console.log(
      `📰 Feed request — user: ${req.user.id}, page: ${page}, type: ${type}`,
    );

    const result = await postsService.getFeedPosts(req.user.id, {
      page,
      limit,
      type,
    });

    console.log(`✅ Feed loaded — ${result.posts.length} posts`);

    return ApiResponse.success(res, "Feed loaded", result.posts, result.meta);
  } catch (error) {
    console.error("❌ Feed error:", error.message, error.stack);
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

module.exports = {
  createImagePost,
  createVideoPost,
  createTextPost,
  createLinkPost,
  getFeed,
  getPost,
  getUserPosts,
  deletePost,
};
