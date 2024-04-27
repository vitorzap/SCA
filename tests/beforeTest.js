async function main() {
  console.log('GETTING STARTED - BEFORE TESTS');
  const fs = require('fs');
  const dotenv = require('dotenv');
  const { resetAutoIncrements, clearTables } = require("../tests/utils/utilsFunctions");
  const { Sequelize } = require('sequelize');
  const customLogger = require('../utils/logHelpers.js');

  dotenv.config();
  const env = process.env.NODE_ENV || 'test';
  const config = require('../config/config.json')[env];
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: customLogger
  });
  
  await resetAutoIncrements(sequelize, ['States','Cities','Clients', 'Teachers','Users', 'Companies'],0)
  await clearTables(sequelize, ['Clients', 'Teachers',  'Cities', 'States', 'Users', 'Companies'])

  console.log('COMPLETED - BEFORE TESTS\n\n');
}

main();