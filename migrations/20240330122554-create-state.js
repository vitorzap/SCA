'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('States', {
      ID_State: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('States');
  }
};
