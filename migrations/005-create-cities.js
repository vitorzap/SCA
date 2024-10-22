'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Cities', {
      ID_City: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      ID_State: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'States',
          key: 'ID_State'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      },
      Name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      Cod_State: {
        type: Sequelize.STRING(2),
        allowNull: false
      },
      Cod_City: {
        type: Sequelize.STRING(10),
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Cities');
  }
};