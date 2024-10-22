'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      ID_User: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      UserName: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      UserEmail: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: 'unique_company_user_email'
      },
      UserPassword: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      ID_UserType: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'UserTypes',
          key: 'ID_UserType'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
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
      }
    });

    await queryInterface.addIndex('Users', ['ID_Company', 'UserEmail'], { unique: true, name: 'unique_company_user_email' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};