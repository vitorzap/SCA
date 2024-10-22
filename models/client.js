'use strict';
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    ID_Client: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    Email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    Phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    DateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    Gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true,
    },
    CPF: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
    },
    Street: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    Complement: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    District: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    CEP: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    RegistrationDate: {
      type: DataTypes.DATE,
      allowNull: false,
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
    ID_User: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'ID_User'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    ID_City: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Cities',
        key: 'ID_City'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  },  {
    timestamps: false,
  });

  Client.associate = (db) => {
    Client.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    Client.belongsTo(db.User, { foreignKey: 'ID_User' });
    Client.belongsTo(db.City, { foreignKey: 'ID_City' });
    Client.hasMany(db.ClientRegularSchedule, { foreignKey: 'ID_Client' });
    Client.hasMany(db.Appointment, { foreignKey: 'ID_Client' });
  };

  return Client;
};