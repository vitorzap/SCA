'use strict';
require('dotenv').config(); 
const getCallerInfo = require('../utils/helpers/debugHelpers');
const { immediateCaller, previousCaller } = getCallerInfo();

console.log('/MODEL/INDEX.JS ==>> SEQUELIZE - INICIANDO')

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const process = require('process');
const { customLogger } = require('../utils/helpers/logHelpers')
const basename = path.basename(__filename);
console.log(`AMBIENTE=${process.env.NODE_ENV}`)
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
// Verificar se o logging é `true` e substituir pela função de log personalizada
if (config.logging === true) {
  config.logging = customLogger; // Substitui pelo logger personalizado
} 
const db = {};
let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

console.log(
  'Connected to MySQL \n' +
  `- Host: ${sequelize.config.host} \n` +
  `- Database: ${sequelize.config.database}`
);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });


// Call associate for each model to define relationships
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
 
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

