'use strict';
module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    ID_Appointment: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Start_Time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    End_Time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    Status: {
      type: DataTypes.ENUM('scheduled', 'performed', 'canceled'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    Day_of_Week: {
      type: DataTypes.INTEGER,
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
    ID_Client: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Clients',
        key: 'ID_Client'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_Professional: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Professionals',
        key: 'ID_Professional'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_Specialty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Specialties',
        key: 'ID_Specialties'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  }, {
    timestamps: false,
  });

  Appointment.associate = (db) => {
    Appointment.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    Appointment.belongsTo(db.Client, { foreignKey: 'ID_Client' });
    Appointment.belongsTo(db.Professional, { foreignKey: 'ID_Professional' });
    Appointment.belongsTo(db.Specialty, { foreignKey: 'ID_Specialty' });
  };

  return Appointment;
};