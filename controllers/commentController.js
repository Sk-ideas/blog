const {
  Comment,
  Post,
  User,
  CommentInteraction,
  CommentReport,
} = require("../models");
const { checkPermissions } = require("../utils/permissionUtils");
const { Op } = require("sequelize");

// @desc    Get single comment
// @route   GET /api/comments/:id
// @access  Public
const getComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ["id", "username", "avatar"],
        },
        {
          model: Comment,
          as: "replies",
          include: [
            {
              model: User,
              attributes: ["id", "username", "avatar"],
            },
          ],
        },
        {
          model: Post,
          attributes: ["id", "title"],
        },
      ],
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json(comment);
  } catch (error) {
    console.error("Get Comment Error:", error);
    res.status(500).json({
      message: "Failed to fetch comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:postId/comments
// @access  Public
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status = "approved", sort = "newest" } = req.query;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const order =
      sort === "oldest" ? [["created_at", "ASC"]] : [["created_at", "DESC"]];

    const comments = await Comment.findAll({
      where: {
        post_id: postId,
        status,
        parent_id: null, // Only get top-level comments
      },
      include: [
        {
          model: User,
          attributes: ["id", "username", "avatar"],
        },
        {
          model: Comment,
          as: "replies",
          include: [
            {
              model: User,
              attributes: ["id", "username", "avatar"],
            },
          ],
        },
        {
          model: CommentInteraction,
          attributes: ["action"],
          where: { user_id: req.user?.id || null },
          required: false,
        },
      ],
      order,
    });

    res.json(comments);
  } catch (error) {
    console.error("Get Comments Error:", error);
    res.status(500).json({
      message: "Failed to fetch comments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:postId/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (parentId) {
      const parentComment = await Comment.findOne({
        where: {
          id: parentId,
          post_id: postId,
        },
      });
      if (!parentComment) {
        return res
          .status(404)
          .json({ message: "Parent comment not found for this post" });
      }
    }

    const comment = await Comment.create({
      content,
      post_id: postId,
      user_id: req.user.id,
      parent_id: parentId || null,
      status: ["admin", "editor"].includes(req.user.role)
        ? "approved"
        : "pending",
    });

    // Populate the response with user data
    const newComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          attributes: ["id", "username", "avatar"],
        },
      ],
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({
      message: "Failed to add comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private (owner or admin/editor)
const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check permissions
    if (
      req.user.id !== comment.user_id &&
      !["admin", "editor"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this comment" });
    }

    const updatedComment = await comment.update({
      content: req.body.content || comment.content,
      status: ["admin", "editor"].includes(req.user.role)
        ? req.body.status || comment.status
        : comment.status,
    });

    res.json(updatedComment);
  } catch (error) {
    console.error("Update Comment Error:", error);
    res.status(500).json({
      message: "Failed to update comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (owner or admin/editor)
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check permissions
    if (
      req.user.id !== comment.user_id &&
      !["admin", "editor"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    await comment.destroy();

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete Comment Error:", error);
    res.status(500).json({
      message: "Failed to delete comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Like/dislike comment
// @route   POST /api/comments/:id/like
// @access  Private
const likeComment = async (req, res) => {
  try {
    const { action } = req.body; // 'like' or 'dislike'
    const comment = await Comment.findByPk(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Prevent liking your own comment
    if (comment.user_id === req.user.id) {
      return res.status(400).json({ message: "Cannot rate your own comment" });
    }

    // Check if user already interacted
    const existingInteraction = await CommentInteraction.findOne({
      where: { comment_id: comment.id, user_id: req.user.id },
    });

    if (existingInteraction) {
      // If same action, remove the interaction
      if (existingInteraction.action === action) {
        await existingInteraction.destroy();
        await comment.decrement(action === "like" ? "likes" : "dislikes");
      }
      // If different action, update it
      else {
        await existingInteraction.update({ action });
        await comment.increment(action === "like" ? "likes" : "dislikes");
        await comment.decrement(action === "like" ? "dislikes" : "likes");
      }
    } else {
      // Create new interaction
      await CommentInteraction.create({
        comment_id: comment.id,
        user_id: req.user.id,
        action,
      });
      await comment.increment(action === "like" ? "likes" : "dislikes");
    }

    // Return updated comment
    const updatedComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: CommentInteraction,
          where: { user_id: req.user.id },
          required: false,
        },
      ],
    });

    res.json(updatedComment);
  } catch (error) {
    console.error("Like Comment Error:", error);
    res.status(500).json({
      message: "Failed to process rating",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Report comment
// @route   POST /api/comments/:id/report
// @access  Private
const reportComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user already reported
    const existingReport = await CommentReport.findOne({
      where: { comment_id: comment.id, user_id: req.user.id },
    });

    if (existingReport) {
      return res
        .status(400)
        .json({ message: "You already reported this comment" });
    }

    await CommentReport.create({
      comment_id: comment.id,
      user_id: req.user.id,
      reason: req.body.reason,
    });

    await comment.update({
      reported: true,
      reported_count: sequelize.literal("reported_count + 1"),
    });

    res.json({ message: "Comment reported successfully" });
  } catch (error) {
    console.error("Report Comment Error:", error);
    res.status(500).json({
      message: "Failed to report comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getComment,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  reportComment,
};
