'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Clients', {
      ID_Client: {
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
      ID_User: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'ID_User'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      Name: {
        type: Sequelize.STRING(80),
        allowNull: false
      },
      Email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      Phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      DateOfBirth: {
        type: Sequelize.DATE,
        allowNull: true
      },
      Gender: {
        type: Sequelize.ENUM('Male', 'Female', 'Other'),
        allowNull: true
      },
      CPF: {
        type: Sequelize.STRING(11),
        allowNull: false,
        unique: true
      },
      Street: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Complement: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      District: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      ID_City: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Cities',
          key: 'ID_City'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      },
      CEP: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      RegistrationDate: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Clients');
  }
};