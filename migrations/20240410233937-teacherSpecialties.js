'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('TeacherSpecialties', {
      ID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ID_Teacher: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Teachers', // This should match the table name for Teacher
          key: 'ID_Teacher'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ID_Specialties: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Specialties', // This should match the table name for Specialty
          key: 'ID_Specialties'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('TeacherSpecialties');
  }
};
