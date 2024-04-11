'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('TimeTableClients', {
      ID_TimeTable: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TimeTables', // Nome da tabela referenciada
          key: 'ID_TimeTable'
        }
      },
      ClientID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Clients', // Nome da tabela referenciada
          key: 'ClientID'
        }
      }
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('TimeTableClients');
  }
};
