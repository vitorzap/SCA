require('dotenv').config(); // Load environment variables from .env file
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// Load Sequelize configurations
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
 
// Create Sequelize instance
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: config.logging,
  operatorsAliases: config.operatorsAliases,
});

// Load models
console.log(__dirname);
const dirAux = path.dirname(__dirname);
console.log(dirAux);
const modelsDir = path.join(dirAux, 'models');
console.log(modelsDir);
const files = fs.readdirSync(modelsDir)
    .filter(file => {
        return (file.indexOf('.') !== 0) && 
              (file !== path.basename(__filename)) && 
              (file.slice(-3) === '.js') &&
              (file.indexOf('associations.js') === -1);
    });
// const models = files.map((file) => require(path.join(modelsDir, file))(sequelize));
const models = files.map((file) => console.log(file));

// Generate migrations
models.forEach((model) => {
  sequelize.getQueryInterface().createTable(model.name, model.tableAttributes);
});
