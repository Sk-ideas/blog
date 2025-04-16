const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authController = require("../controllers/authController");

router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);


router.use(authController.protect);

router.post(
  "/",
  authController.restrictTo("admin", "editor"),
  categoryController.createCategory
);
router.put(
  "/:id",
  authController.restrictTo("admin", "editor"),
  categoryController.updateCategory
);
router.delete(
  "/:id",
  authController.restrictTo("admin", "editor"),
  categoryController.deleteCategory
);

module.exports = router;
