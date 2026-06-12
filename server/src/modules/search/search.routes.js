const express = require("express");
const router = express.Router();

const controller = require("./search.controller");
const { authenticate } = require("../../middleware/auth");
const { searchLimiter } = require("../../middleware/rateLimiter");

router.use(authenticate);
router.use(searchLimiter);

router.get("/", controller.searchAll);
router.get("/users", controller.searchUsers);
router.get("/posts", controller.searchPosts);
router.get("/notices", controller.searchNotices);

module.exports = router;
