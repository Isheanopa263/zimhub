const commentsService = require("./comments.service");
const ApiResponse = require("../../utils/ApiResponse");

const createComment = async (req, res, next) => {
  try {
    const { content, parentCommentId } = req.body;

    const comment = await commentsService.createComment(
      req.params.postId,
      req.user.id,
      content,
      parentCommentId || null,
    );

    return ApiResponse.created(res, "Comment posted", comment);
  } catch (error) {
    next(error);
  }
};

const getPostComments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await commentsService.getPostComments(req.params.postId, {
      page,
      limit,
    });

    return ApiResponse.success(
      res,
      "Comments loaded",
      result.comments,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

const getCommentReplies = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await commentsService.getCommentReplies(req.params.id, {
      page,
      limit,
    });

    return ApiResponse.success(
      res,
      "Replies loaded",
      result.replies,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const result = await commentsService.deleteComment(
      req.params.id,
      req.user.id,
      isAdmin,
    );
    return ApiResponse.success(res, "Comment deleted", result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getPostComments,
  getCommentReplies,
  deleteComment,
};
