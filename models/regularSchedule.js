'use strict';
module.exports = (sequelize, DataTypes) => {
  const RegularSchedule = sequelize.define('RegularSchedule', {
    ID_RegularSchedule: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Day_of_Week: {
      type: DataTypes.INTEGER,
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
    Capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Current_Clients: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Start_Date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    End_Date: {
      type: DataTypes.DATE,
      allowNull: true,
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
    ID_Professional: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
  },  {
    timestamps: false,
  });

  RegularSchedule.associate = (db) => {
    RegularSchedule.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    RegularSchedule.belongsTo(db.Professional, { foreignKey: 'ID_Professional' });
    RegularSchedule.belongsTo(db.Specialty, { foreignKey: 'ID_Specialty' });
    RegularSchedule.hasMany(db.ClientRegularSchedule, { foreignKey: 'ID_RegularSchedule' });
  };

  return RegularSchedule;
};