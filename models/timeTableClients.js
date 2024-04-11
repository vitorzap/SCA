'use strict';

module.exports = (sequelize, DataTypes) => {
  const TimeTableClients = sequelize.define('TimeTableClients', {
    // Se necessário, você pode adicionar colunas adicionais aqui
    ID_TimeTable: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TimeTable', // Nome do modelo TimeTable
        key: 'id'
      }
    },
    ClientID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Client', // Nome do modelo Client
        key: 'id'
      }
    }
  });

  return TimeTableClients;
};