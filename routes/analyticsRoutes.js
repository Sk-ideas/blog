const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const authController = require("../controllers/authController");

router.use(authController.protect);

router.get("/posts/:postId", analyticsController.getPostAnalytics);
router.get(
  "/engagement",
  authController.restrictTo("admin", "editor"),
  analyticsController.getUserEngagement
);

module.exports = router;
