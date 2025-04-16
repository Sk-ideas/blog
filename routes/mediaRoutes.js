const express = require("express");
const router = express.Router();
const mediaController = require("../controllers/mediaController");
const authController = require("../controllers/authController");
const { upload } = require("../middlewares/uploadMiddleware");

router.use(authController.protect);

router.post(
  "/",
  authController.restrictTo("admin", "editor", "author"),
  upload.single("image"),
  mediaController.uploadMedia
);

router.get(
  "/",
  authController.restrictTo("admin", "editor"),
  mediaController.getAllMedia
);

router.get("/:id", mediaController.getMediaById);

router.delete("/:id", mediaController.deleteMedia);

module.exports = router;
