const { Analytics, Post } = require("../models");
const { checkPermissions } = require("../utils/permissionUtils");
const { Op, Sequelize } = require("sequelize");

// @desc    Get post analytics
// @route   GET /api/analytics/posts/:postId
// @access  Private (admin, editor, author)
const getPostAnalytics = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check permissions
    if (req.user.role === "author" && post.author_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view analytics for this post" });
    }

    // Get view count
    const viewCount = await Analytics.count({
      where: { post_id: postId, event_type: "view" },
    });

    // Get average time spent
    const avgTime = await Analytics.findOne({
      where: { post_id: postId, event_type: "view" },
      attributes: [
        [
          Sequelize.fn(
            "AVG",
            Sequelize.cast(Sequelize.json("event_data.duration"), "INTEGER")
          ),
          "avgTime",
        ],
      ],
    });

    // Get comment count
    const commentCount = await Comment.count({
      where: { post_id: postId },
    });

    // Get like count
    const likeCount = await Comment.sum("likes", {
      where: { post_id: postId },
    });

    // Get view data by date
    const viewsByDate = await Analytics.findAll({
      where: { post_id: postId, event_type: "view" },
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("created_at")), "date"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("created_at"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("created_at")), "ASC"]],
    });

    res.json({
      viewCount,
      avgTime: avgTime.dataValues.avgTime || 0,
      commentCount,
      likeCount,
      viewsByDate,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user engagement
// @route   GET /api/analytics/engagement
// @access  Private (admin, editor)
const getUserEngagement = async (req, res, next) => {
  try {
    checkPermissions(req.user, ["admin", "editor"]);

    // Get top posts by views
    const topPosts = await Post.findAll({
      attributes: [
        "id",
        "title",
        "slug",
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM analytics WHERE analytics.post_id = post.id AND analytics.event_type = "view")'
          ),
          "viewCount",
        ],
      ],
      order: [[Sequelize.literal("viewCount"), "DESC"]],
      limit: 5,
    });

    // Get recent comments
    const recentComments = await Comment.findAll({
      include: [
        {
          model: Post,
          attributes: ["id", "title", "slug"],
        },
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 5,
    });

    // Get user activity
    const userActivity = await User.findAll({
      attributes: [
        "id",
        "username",
        [
          Sequelize.literal(
            "(SELECT COUNT(*) FROM posts WHERE posts.author_id = user.id)"
          ),
          "postCount",
        ],
        [
          Sequelize.literal(
            "(SELECT COUNT(*) FROM comments WHERE comments.user_id = user.id)"
          ),
          "commentCount",
        ],
      ],
      order: [[Sequelize.literal("postCount"), "DESC"]],
      limit: 5,
    });

    res.json({
      topPosts,
      recentComments,
      userActivity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPostAnalytics,
  getUserEngagement,
};
