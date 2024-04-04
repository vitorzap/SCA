'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Cities', {
      ID_City: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ID_State: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'States', // Nome da tabela referenciada
          key: 'ID_State',
        },
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

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Cities');
  }
};
