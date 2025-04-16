module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
     
      username: DataTypes.STRING,
      email: DataTypes.STRING,
      password_hash: DataTypes.STRING,
      role: DataTypes.STRING,
      
    },
    {
      tableName: "users",
      timestamps: true, 
      createdAt: "created_at", 
      updatedAt: "updated_at", 
      underscored: true, 
    }
  );

  return User;
};
