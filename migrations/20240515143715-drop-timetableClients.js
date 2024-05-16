'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TimeTableClients');
  },

  down: async (queryInterface, Sequelize) => {
    // Defina a estrutura da tabela TimeTableClients se for necessário fazer o rollback
    await queryInterface.createTable('TimeTableClients', {
      ID_TimeTable: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TimeTable',
          key: 'id'
        }
      },
      ClientID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Client',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  }
};
