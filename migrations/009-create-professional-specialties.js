'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ProfessionalSpecialties', {
      ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      ID_Professional: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Professionals',
          key: 'ID_Professional'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      },
      ID_Specialties: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Specialties',
          key: 'ID_Specialties'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ProfessionalSpecialties');
  }
};