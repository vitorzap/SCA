'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Specialties', {
      ID_Specialties: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      ID_Company: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'ID_Company'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      },
      Description: {
        type: Sequelize.STRING(100),
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Specialties');
  }
};