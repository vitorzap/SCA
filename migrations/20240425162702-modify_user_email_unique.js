'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remover a constraint de unicidade de UserEmail
    await queryInterface.removeIndex('Users', 'UserEmail');


    // Adicionar uma nova constraint única para a combinação de ID_Company e UserEmail
    await queryInterface.addConstraint('Users', {
      fields: ['ID_Company', 'UserEmail'],
      type: 'unique',
      name: 'unique_company_user_email'
    });

    // Adicionar uma nova constraint única para a combinação de ID_Company e UserName
    await queryInterface.addConstraint('Users', {
      fields: ['ID_Company', 'UserName'],
      type: 'unique',
      name: 'unique_company_user_name'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remover as constraints combinadas
    await queryInterface.removeConstraint('Users', 'unique_company_user_email');
    await queryInterface.removeConstraint('Users', 'unique_company_user_name');

    // Restaurar a constraint única para UserEmail
    await queryInterface.addIndex('Users', {
      fields: ['UserEmail'],
      unique: true,
      name: 'UserEmail'
    });
  }
};
