const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const authController = require("../controllers/authController");

router.use(authController.protect);

router.get("/:id", commentController.getComment);
router.put("/:id", commentController.updateComment);
router.delete("/:id", commentController.deleteComment);
router.post("/:id/like", commentController.likeComment);
router.post("/:id/report", commentController.reportComment);

module.exports = router;
