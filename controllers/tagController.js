const { Tag, Post } = require("../models");
const { Op } = require("sequelize");
const { checkPermissions } = require("../utils/permissionUtils");

// @desc    Get all tags
// @route   GET /api/tags
// @access  Public
const getAllTags = async (req, res) => {
  try {
    const { search } = req.query;

    const where = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const tags = await Tag.findAll({
      where,
      order: [["name", "ASC"]],
      attributes: ["id", "name", "slug", "created_at"],
      include: [
        {
          model: Post,
          attributes: ["id", "title"],
          through: { attributes: [] },
          as: "posts",
        },
      ],
    });

    res.json(tags);
  } catch (error) {
    console.error("Get All Tags Error:", error);
    res.status(500).json({
      message: "Failed to fetch tags",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get single tag by ID
// @route   GET /api/tags/:id
// @access  Public
const getTagById = async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id, {
      attributes: ["id", "name", "slug", "created_at"],
      include: [
        {
          model: Post,
          attributes: ["id", "title", "slug"],
          through: { attributes: [] },
          as: "posts",
        },
      ],
    });

    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    res.json(tag);
  } catch (error) {
    console.error("Get Tag By ID Error:", error);
    res.status(500).json({
      message: "Failed to fetch tag",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Create new tag
// @route   POST /api/tags
// @access  Private/Admin
const createTag = async (req, res) => {
  try {
    checkPermissions(req.user, ["admin", "editor"]);

    const { name } = req.body;

    // Check if tag exists
    const existingTag = await Tag.findOne({
      where: { name },
      attributes: ["id"],
    });

    if (existingTag) {
      return res.status(400).json({ message: "Tag already exists" });
    }

    const tag = await Tag.create({
      name,
      slug: name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, ""),
    });

    const response = {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      created_at: tag.created_at,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Create Tag Error:", error);
    res.status(500).json({
      message: "Failed to create tag",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update tag
// @route   PUT /api/tags/:id
// @access  Private/Admin
const updateTag = async (req, res) => {
  try {
    checkPermissions(req.user, ["admin", "editor"]);

    const { name } = req.body;

    const tag = await Tag.findByPk(req.params.id, {
      attributes: ["id", "name", "slug"],
    });

    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    // Check if new name already exists (excluding current tag)
    if (name && name !== tag.name) {
      const existingTag = await Tag.findOne({
        where: {
          name,
          id: { [Op.ne]: req.params.id },
        },
        attributes: ["id"],
      });
      if (existingTag) {
        return res.status(400).json({ message: "Tag name already exists" });
      }
    }

    const updatedFields = {};
    if (name) {
      updatedFields.name = name;
      updatedFields.slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");
    }

    await tag.update(updatedFields);

    const response = {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      created_at: tag.created_at,
    };

    res.json(response);
  } catch (error) {
    console.error("Update Tag Error:", error);
    res.status(500).json({
      message: "Failed to update tag",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete tag
// @route   DELETE /api/tags/:id
// @access  Private/Admin
const deleteTag = async (req, res) => {
  try {
    checkPermissions(req.user, ["admin"]);

    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    await tag.destroy();
    res.json({ message: "Tag removed successfully" });
  } catch (error) {
    console.error("Delete Tag Error:", error);
    res.status(500).json({
      message: "Failed to delete tag",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
};
