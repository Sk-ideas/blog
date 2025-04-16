module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    "Post",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      excerpt: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM("draft", "published", "scheduled"),
        defaultValue: "draft",
        allowNull: false,
      },
      published_at: {
        type: DataTypes.DATE,
      },
      author_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },
      featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      sticky: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "posts",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
      defaultScope: {
        where: {
          status: "published",
        },
      },
      scopes: {
        withDrafts: {
          where: {},
        },
        withAuthor: {
          include: ["author"],
        },
      },
    }
  );

  Post.associate = (models) => {
    Post.belongsTo(models.User, {
      foreignKey: "author_id",
      as: "author",
    });

    Post.belongsToMany(models.Tag, {
      through: "post_tags",
      foreignKey: "post_id",
      otherKey: "tag_id",
      as: "tags",
      timestamps: false,
    });
  };

  return Post;
};
