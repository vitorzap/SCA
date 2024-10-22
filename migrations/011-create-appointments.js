'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Appointments', {
      ID_Appointment: {
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
      ID_Specialty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Specialties',
          key: 'ID_Specialties'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
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
      Date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      Start_Time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      End_Time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      Status: {
        type: Sequelize.ENUM('scheduled', 'performed', 'canceled'),
        allowNull: false,
        defaultValue: 'scheduled'
      },
      Day_of_Week: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Appointments');
  }
};