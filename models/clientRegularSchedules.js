'use strict';

module.exports = (sequelize, DataTypes) => {
  const ClientRegularSchedules = sequelize.define('ClientRegularSchedules', {
    ID_ClientRegularSchedules: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ClientID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Clients',
        key: 'ClientID'
      }
    },
    ID_RegularSchedule: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'RegularSchedules',
        key: 'ID_RegularSchedule'
      }
    }
  }, {
    tableName: 'ClientRegularSchedules',
    timestamps: false
  });

  return ClientRegularSchedules;
};
