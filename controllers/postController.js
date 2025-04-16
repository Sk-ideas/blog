const { Post, Tag, User } = require("../models");
const { Op } = require("sequelize");
const { checkPermissions } = require("../utils/permissionUtils");

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getAllPosts = async (req, res) => {
  try {
    const { status, search, tag } = req.query;
    const where = {};
    const include = [];

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tag) {
      include.push({
        model: Tag,
        where: { id: tag },
        attributes: [],
        through: { attributes: [] },
      });
    }

    include.push({
      model: User,
      as: "author",
      attributes: ["id", "username", "email"],
    });

    const posts = await Post.findAll({
      where,
      include,
      order: [
        ["sticky", "DESC"],
        ["published_at", "DESC"],
      ],
      attributes: { exclude: ["author_id"] },
    });

    res.json(posts);
  } catch (error) {
    console.error("Get All Posts Error:", error);
    res.status(500).json({
      message: "Failed to fetch posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get single post by ID or slug
// @route   GET /api/posts/:identifier
// @access  Public
const getPostById = async (req, res) => {
  try {
    const { identifier } = req.params;
    const where = isNaN(identifier) ? { slug: identifier } : { id: identifier };

    const post = await Post.findOne({
      where,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username", "email"],
        },
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
          attributes: ["id", "name", "slug"],
        },
      ],
      attributes: { exclude: ["author_id"] },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error("Get Post By ID Error:", error);
    res.status(500).json({
      message: "Failed to fetch post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private/Author
const createPost = async (req, res) => {
  try {
    checkPermissions(req.user, ["admin", "author"]);

    const {
      title,
      content,
      excerpt,
      status,
      published_at,
      featured,
      sticky,
      tags,
    } = req.body;

    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

    const post = await Post.create({
      title,
      slug,
      content,
      excerpt,
      status,
      published_at: status === "published" ? new Date() : published_at,
      author_id: req.user.id,
      featured: featured || false,
      sticky: sticky || false,
    });

    if (tags && tags.length > 0) {
      await post.setTags(tags);
    }

    const response = await Post.findByPk(post.id, {
      include: [
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
          attributes: ["id", "name", "slug"],
        },
      ],
      attributes: { exclude: ["author_id"] },
    });

    res.status(201).json(response);
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(500).json({
      message: "Failed to create post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private/Author or Admin
const updatePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check permissions - author can only edit their own posts
    if (req.user.role !== "admin" && post.author_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    const {
      title,
      content,
      excerpt,
      status,
      published_at,
      featured,
      sticky,
      tags,
    } = req.body;

    const updateData = {
      content: content || post.content,
      excerpt: excerpt || post.excerpt,
      status: status || post.status,
      featured: featured !== undefined ? featured : post.featured,
      sticky: sticky !== undefined ? sticky : post.sticky,
    };

    if (title && title !== post.title) {
      updateData.title = title;
      updateData.slug = title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");
    }

    if (status === "published" && post.status !== "published") {
      updateData.published_at = new Date();
    } else if (published_at) {
      updateData.published_at = published_at;
    }

    await post.update(updateData);

    if (tags) {
      await post.setTags(tags);
    }

    const response = await Post.findByPk(post.id, {
      include: [
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
          attributes: ["id", "name", "slug"],
        },
      ],
      attributes: { exclude: ["author_id"] },
    });

    res.json(response);
  } catch (error) {
    console.error("Update Post Error:", error);
    res.status(500).json({
      message: "Failed to update post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private/Author or Admin
const deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check permissions - author can only delete their own posts
    if (req.user.role !== "admin" && post.author_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await post.destroy();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete Post Error:", error);
    res.status(500).json({
      message: "Failed to delete post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};
