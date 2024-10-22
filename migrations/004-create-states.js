'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('States', {
      ID_State: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      Name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      Acronym: {
        type: Sequelize.STRING(2),
        allowNull: false,
        unique: true
      },
      Cod_State: {
        type: Sequelize.STRING(2),
        allowNull: false,
        unique: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('States');
  }
};