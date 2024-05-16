'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TimeTables');
  },

  down: async (queryInterface, Sequelize) => {
    // Defina a estrutura da tabela TimeTable se for necessário fazer o rollback
    await queryInterface.createTable('TimeTables', {
      ID_Company: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'ID_Company'
        }
      },
      ID_TimeTable: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        type: Sequelize.STRING(20),
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
        allowNull: false,
        validate: {
          min: 1
        }
      },
      Available_Capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
      }
    });
  }
};
