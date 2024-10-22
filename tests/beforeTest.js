async function main() {
  // Global variable to store UserTypes
  global.userTypes = [];

  console.log('GETTING STARTED - BEFORE TESTS');
  const fs = require('fs');
  const dotenv = require('dotenv');
  const { resetAutoIncrements, clearTables, getAllRecs } = require("../tests/utils/utilsFunctions");
  const { Sequelize } = require('sequelize');
  const customLogger = require('../utils/logHelpers.js');

  dotenv.config();
  const env = process.env.NODE_ENV || 'test';
  const config = require('../config/config.json')[env];
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: customLogger
  });

  await resetAutoIncrements(sequelize, [
    'States',
    'ProfessionalSpecialties',
    'Cities', 'Clients',
    'Professionals',
    'Users', 
    'Companies'
  ], 0);

  await clearTables(sequelize, [
    'Clients', 
    'ProfessionalSpecialties',
    'Professionals',  
    'Cities', 
    'States', 
    'Users', 
    'Specialties', 
    'Companies'
  ]);

  console.log('COMPLETED - BEFORE TESTS\n\n');
  
  // Exit the process to ensure it finishes properly before running tests
  process.exit(0);
}

main().catch(err => {
  console.error('Error in beforeTest script:', err);
  process.exit(1);
});