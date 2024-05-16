'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('RegularSchedules', {
      ID_RegularSchedule: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      Day_of_Week: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 6
        }
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
        allowNull: false,
        validate: {
          min: 1
        }
      },
      Current_Clients: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          customValidator(value) {
            if (value > this.Capacity) {
              throw new Error('Current_Clients cannot exceed Capacity');
            }
          }
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('RegularSchedules');
  }
};
