'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('UserTypes', 'UserTypeLevel', {
      type: Sequelize.INTEGER,
      allowNull: false // ou allowNull: true, dependendo da necessidade
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('UserTypes', 'UserTypeLevel');
  }
};