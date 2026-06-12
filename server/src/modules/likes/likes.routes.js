const express = require("express");
const router = express.Router();
const { param } = require("express-validator");

const controller = require("./likes.controller");
const { authenticate } = require("../../middleware/auth");
const validate = require("../../middleware/validate");

router.use(authenticate);

const postIdParam = [param("postId").isUUID().withMessage("Invalid post ID")];

// POST /api/v1/likes/posts/:postId — toggle like
router.post("/posts/:postId", postIdParam, validate, controller.toggleLike);

// GET /api/v1/likes/posts/:postId — list users who liked
router.get("/posts/:postId", postIdParam, validate, controller.getPostLikes);

module.exports = router;
