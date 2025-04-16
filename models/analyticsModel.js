const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Analytics = sequelize.define(
    "Analytics",
    {
      event_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      event_data: {
        type: DataTypes.JSONB,
      },
    },
    {
      tableName: "analytics",
      timestamps: true,
    }
  );

  Analytics.associate = (models) => {
    Analytics.belongsTo(models.Post, {
      foreignKey: "post_id",
      as: "post",
    });
    Analytics.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return Analytics;
};
