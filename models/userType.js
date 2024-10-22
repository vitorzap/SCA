'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserType = sequelize.define('UserType', {
    ID_UserType: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    TypeName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    UserTypeLevel: {
      type: DataTypes.INTEGER,
      allowNull: false, // ou allowNull: true, dependendo da necessidade
    }
  },  {
    timestamps: false,
  });

  UserType.associate = (db) => {
    UserType.hasMany(db.User, { foreignKey: 'ID_UserType' });
  };

  return UserType;
};