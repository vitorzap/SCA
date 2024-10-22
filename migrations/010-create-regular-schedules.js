'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('RegularSchedules', {
      ID_RegularSchedule: {
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
        allowNull: true,
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
      Day_of_Week: {
        type: Sequelize.INTEGER,
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
      Capacity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      Current_Clients: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      Start_Date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      End_Date: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('RegularSchedules');
  }
};