'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    ID_User: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    UserName: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    UserEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: 'unique_company_user_email'
    },
    UserPassword: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ID_UserType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'UserTypes',
        key: 'ID_UserType'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    token_version: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    }
  }, {
    timestamps: false,
  });

  User.associate = (db) => {
    User.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    User.belongsTo(db.UserType, { foreignKey: 'ID_UserType' });
    User.hasOne(db.Professional, { foreignKey: 'ID_User' });
    User.hasOne(db.Client, { foreignKey: 'ID_User' });
  };
  
  return User;
};