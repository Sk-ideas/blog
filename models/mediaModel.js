module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define(
    "Media",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      original_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      stored_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      path: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      width: {
        type: DataTypes.INTEGER,
      },
      height: {
        type: DataTypes.INTEGER,
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "media",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: [],
        },
      },
    }
  );

  Media.associate = (models) => {
    Media.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return Media;
};
