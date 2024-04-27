'use strict'; 
console.log('/MODEL/INDEX.JS ==>> INICIANDO')

const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const customLogger = require('../utils/logHelpers.js')

dotenv.config(); // Load environment variables from .env file

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

// Creating a new Sequelize instance using our configuration
// const sequelize = new Sequelize(config.database, config.username, config.password, config);

const sequelize = new Sequelize(config.database, config.username, config.password, {
  ...config,
  logging: customLogger
});



const db = {};

// Reading all the model files in the directory
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && 
           (file !== path.basename(__filename)) && 
           (file.slice(-3) === '.js') &&
           (file.indexOf('associations.js') === -1);
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Checking model associations
// Object.keys(db).forEach(modelName => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
