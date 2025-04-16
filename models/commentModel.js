const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Comment = sequelize.define(
    "Comment",
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      dislikes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      reported: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: DataTypes.ENUM("approved", "pending", "rejected"),
        defaultValue: "approved",
      },
    },
    {
      tableName: "comments",
      timestamps: true,
      underscored: true,
    }
  );

  Comment.associate = (models) => {
    Comment.belongsTo(models.Post, {
      foreignKey: "post_id",
      as: "post",
    });
    Comment.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    Comment.belongsTo(models.Comment, {
      foreignKey: "parent_id",
      as: "parent",
    });
    Comment.hasMany(models.Comment, {
      foreignKey: "parent_id",
      as: "replies",
    });
  };

  return Comment;
};
