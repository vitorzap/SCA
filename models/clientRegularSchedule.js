'use strict';
module.exports = (sequelize, DataTypes) => {
  const ClientRegularSchedule = sequelize.define('ClientRegularSchedule', {
    ID_ClientRegularSchedules: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    ID_RegularSchedule: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'RegularSchedules',
        key: 'ID_RegularSchedule'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  }, {
    timestamps: false,
  });

  ClientRegularSchedule.associate = (db) => {
    ClientRegularSchedule.belongsTo(db.Client, { foreignKey: 'ID_Client' });
    ClientRegularSchedule.belongsTo(db.RegularSchedule, { foreignKey: 'ID_RegularSchedule' });
  };

  return ClientRegularSchedule;
};