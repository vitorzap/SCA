'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Clients', {
      ID_Company: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'ID_Company'
        }
      },
      ClientID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      UserID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users',
          key: 'UserID'
        }
      },
      Name: {
        type: Sequelize.STRING(80),
        allowNull: false
      },
      Email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      Phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      DateOfBirth: {
        type: Sequelize.DATEONLY,
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
        }
      },
      CEP: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      RegistrationDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Clients');
  }
};
