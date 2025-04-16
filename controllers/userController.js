const User = require("../models/userModel");
const { checkPermissions } = require("../utils/permissionUtils");

// @desc    Get all users (with pagination)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    checkPermissions(req.user, ["admin"]);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ["password_hash"] },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      users,
      total: count,
      page,
      pages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({
      message: "Failed to fetch users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin or Self
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.role !== "admin" && req.user.id !== user.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({
      message: "Failed to fetch user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin or Self
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.role !== "admin" && req.user.id !== user.id) {
      return res.status(403).json({ message: "Unauthorized update" });
    }

    if (req.body.role && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Role modification requires admin privileges",
      });
    }

    if (req.body.password) {
      return res.status(400).json({
        message: "Use password reset endpoint instead",
      });
    }

    const allowedFields = ["username", "email", "bio", "social_media_links"];
    if (req.user.role === "admin") allowedFields.push("role");

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const updatedUser = await user.update(updateData);

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      bio: updatedUser.bio,
      social_media_links: updatedUser.social_media_links,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({
      message: "Failed to update user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    checkPermissions(req.user, ["admin"]);

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.id === user.id) {
      return res.status(400).json({
        message: "Cannot delete your own account",
      });
    }

    await user.destroy();
    res.json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      message: "Failed to delete user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getAllUsers, // Make sure this matches what's imported in routes
  getUserById,
  updateUser,
  deleteUser,
};
