const express = require("express");
const router = express.Router();
const tagController = require("../controllers/tagController");
const authController = require("../controllers/authController");

router.get("/", tagController.getAllTags);
router.get("/:id", tagController.getTagById);

router.use(authController.protect);

router.post(
  "/",
  authController.restrictTo("admin", "editor"),
  tagController.createTag
);
router.put(
  "/:id",
  authController.restrictTo("admin", "editor"),
  tagController.updateTag
);
router.delete(
  "/:id",
  authController.restrictTo("admin", "editor"),
  tagController.deleteTag
);

module.exports = router;
