'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ClientRegularSchedules', {
      ID_ClientRegularSchedules: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      ID_Client: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Clients',
          key: 'ID_Client'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      },
      ID_RegularSchedule: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'RegularSchedules',
          key: 'ID_RegularSchedule'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ClientRegularSchedules');
  }
};