const fs = require('fs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { sequelize } = require ('../../models');


function getRandomNumber(min, max) {
  // Verifica se o intervalo é válido
  if (min >= max) {
    throw new Error('O valor mínimo deve ser menor que o valor máximo.');
  }
  const randomNumber = Math.random();
  const randomInteger = Math.floor(randomNumber * (max - min + 1)) + min;
  return randomInteger;
}



async function  getBaseDir() {
  var dirInit=__dirname;
  var files = fs.readdirSync(dirInit);
  while ((files.indexOf('app.js') == -1) && (dirInit!=="/")) {
    dirInit=path.dirname(dirInit);
    files = fs.readdirSync(dirInit);
  }
} 

async function  changeDbEnv(envFilePath,envStr) {
    // Verifica se o arquivo .env existe
    if (!fs.existsSync(envFilePath)) {
        console.error(`.env file (${envFilePath}) not found.`);
        return;
    }
    const envStrU=envStr.toUpperCase();
    var lineU;
    const envContent = fs.readFileSync(envFilePath, 'utf-8');
    const lines = envContent.split('\n');
    const modifiedLines = lines.map(line => {
        lineU = line.toUpperCase();
        if ((lineU.startsWith('NODE_ENV=')) && (!(lineU.startsWith('NODE_ENV='+envStrU))))  {
            return `#*${line}`;
        }
        if (lineU.startsWith('#*NODE_ENV='+envStr.toUpperCase())) {
            console.log(`Changing Environment DB to (${lineU.substring(11)})`);
            return 'NODE_ENV='+envStr;
        }
        return line;
    });
    const updatedEnvContent = modifiedLines.join('\n');
    fs.writeFileSync(envFilePath, updatedEnvContent);
    console.log(`Environment DB set to (${envStrU})`);
}

async function resetAutoIncrements(sequelize, tableNames, newValue = 1) {
    var initValue;
    console.log(`Ressetting ${sequelize.config.database} Database auto Increments:`);
    try {
      for (const tableName of tableNames) {
        if (newValue==0) {
          initValue = getRandomNumber(1, 999);
        } else {
          initValue = newValue;
        }
        await sequelize.query(`ALTER TABLE ${tableName} AUTO_INCREMENT = ${initValue};`);
        console.log(`- ${tableName} reset to ${initValue}`);
      }
    } catch (error) {
      console.error('Error resetting auto increments:', error);
    }
  }

  async function clearTables(sequelize, tableNames, newValue = 1) {
    console.log(`Emptying table from database: ${sequelize.config.database}`);
    try {
      for (const tableName of tableNames) {
        await sequelize.query(`DELETE FROM ${tableName};`);
        console.log(`Table ${tableName} empty`);
      }
    } catch (error) {
      console.error(`ERROR: Emptying table: ${sequelize.config.database} => ${error}`);
    }
  }



module.exports = { getRandomNumber ,changeDbEnv, resetAutoIncrements, clearTables};