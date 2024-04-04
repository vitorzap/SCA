// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      }
    },
    UserID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    UserName: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    UserEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    UserPassword: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    UserType: {
      type: DataTypes.ENUM('Root', 'Admin', 'Teacher', 'Client'),
      allowNull: false
    },
  }, {
    timestamps: false,
    tableName: 'Users'
  });

  return User;
};
