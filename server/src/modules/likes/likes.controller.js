const likesService = require("./likes.service");
const ApiResponse = require("../../utils/ApiResponse");

const toggleLike = async (req, res, next) => {
  try {
    const result = await likesService.toggleLike(
      req.params.postId,
      req.user.id,
    );
    return ApiResponse.success(res, `Post ${result.action}`, result);
  } catch (error) {
    next(error);
  }
};

const getPostLikes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await likesService.getPostLikes(req.params.postId, {
      page,
      limit,
    });

    return ApiResponse.success(res, "Likes loaded", result.users, result.meta);
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleLike, getPostLikes };
