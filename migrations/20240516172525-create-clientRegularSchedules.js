'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ClientRegularSchedules', {
      ID_ClientRegularSchedules: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ClientID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Clients',
          key: 'ClientID'
        }
      },
      ID_RegularSchedule: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'RegularSchedules',
          key: 'ID_RegularSchedule'
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ClientRegularSchedules');
  }
};
