'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Appointments', {
      ID_Appointment: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ID_RegularSchedule: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'RegularSchedules',
          key: 'ID_RegularSchedule'
        }
      },
      ID_Company: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'ID_Company'
        }
      },
      ID_Teacher: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Teachers',
          key: 'ID_Teacher'
        }
      },
      ID_Specialty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Specialties',
          key: 'ID_Specialties'
        }
      },
      ClientID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Clients',
          key: 'ClientID'
        }
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
        type: Sequelize.ENUM,
        values: ['scheduled', 'performed', 'canceled'],
        allowNull: false,
        defaultValue: 'scheduled'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Appointments');
  }
};
