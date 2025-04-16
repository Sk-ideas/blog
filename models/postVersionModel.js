const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PostVersion = sequelize.define(
    "PostVersion",
    {
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      version_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "post_versions",
      timestamps: true,
    }
  );

  PostVersion.associate = (models) => {
    PostVersion.belongsTo(models.Post, {
      foreignKey: "post_id",
      as: "post",
    });
    PostVersion.belongsTo(models.User, {
      foreignKey: "author_id",
      as: "author",
    });
  };

  return PostVersion;
};
