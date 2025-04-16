const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

router.use(authController.protect);

router.get("/", authController.restrictTo("admin"), userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.delete(
  "/:id",
  authController.restrictTo("admin"),
  userController.deleteUser
);

module.exports = router;
