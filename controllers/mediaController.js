const { Media, User, PostMedia } = require("../models");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { checkPermissions } = require("../utils/permissionUtils");

// @desc    Upload media file
// @route   POST /api/media
// @access  Private (Admin, Editor, Author)
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Process image with sharp
    const imagePath = req.file.path;
    const thumbPath = path.join(
      path.dirname(imagePath),
      `thumb-${req.file.filename}`
    );

    // Create thumbnail
    await sharp(imagePath)
      .resize(300, 300, {
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .toFile(thumbPath);

    // Get image metadata
    const metadata = await sharp(imagePath).metadata();

    // Save to database
    const media = await Media.create({
      original_name: req.file.originalname,
      stored_name: req.file.filename,
      path: req.file.path,
      mime_type: req.file.mimetype,
      size: req.file.size,
      width: metadata.width,
      height: metadata.height,
      user_id: req.user.id,
    });

    // Include user data in response
    const mediaWithUser = await Media.findByPk(media.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"],
        },
      ],
    });

    res.status(201).json(mediaWithUser);
  } catch (error) {
    console.error("Upload Media Error:", error);

    // Clean up uploaded files if error occurred
    if (req.file) {
      const thumbPath = path.join(
        path.dirname(req.file.path),
        `thumb-${req.file.filename}`
      );
      [req.file.path, thumbPath].forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    res.status(500).json({
      message: "Failed to upload media",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all media
// @route   GET /api/media
// @access  Private (Admin, Editor)
const getAllMedia = async (req, res) => {
  try {
    checkPermissions(req.user, ["admin", "editor"]);

    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where.original_name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows: media } = await Media.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      media,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Get All Media Error:", error);
    res.status(500).json({
      message: "Failed to fetch media",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get single media
// @route   GET /api/media/:id
// @access  Private (Admin, Editor, Owner)
const getMediaById = async (req, res) => {
  try {
    const media = await Media.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"],
        },
      ],
    });

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      req.user.role !== "editor" &&
      req.user.id !== media.user_id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this media" });
    }

    res.json(media);
  } catch (error) {
    console.error("Get Media By ID Error:", error);
    res.status(500).json({
      message: "Failed to fetch media",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete media
// @route   DELETE /api/media/:id
// @access  Private (Admin, Editor, Owner)
const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findByPk(req.params.id);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Check permissions
    if (
      req.user.role !== "admin" &&
      req.user.role !== "editor" &&
      req.user.id !== media.user_id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this media" });
    }

    // Check if media is used in any posts
    const postMedia = await PostMedia.findOne({
      where: { media_id: media.id },
    });
    if (postMedia) {
      return res
        .status(400)
        .json({ message: "Media is used in posts and cannot be deleted" });
    }

    // Delete files
    const filesToDelete = [
      media.path,
      path.join(path.dirname(media.path), `thumb-${media.stored_name}`),
    ];

    for (const filePath of filesToDelete) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await media.destroy();

    res.json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Delete Media Error:", error);
    res.status(500).json({
      message: "Failed to delete media",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  uploadMedia,
  getAllMedia,
  getMediaById,
  deleteMedia,
};
