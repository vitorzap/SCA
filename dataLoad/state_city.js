//
const fs = require('fs');
const csv = require('csv-parser');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

process.stdout.write('INICIANDO A CARGA => ESTADOS E CIDADES\n\r')

dotenv.config(); // Load environment variables from .env file

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

// Creating a new Sequelize instance using our configuration
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Definição dos modelos (ajuste os caminhos conforme necessário)
require('../models/state')(sequelize, DataTypes);
require('../models/city')(sequelize, DataTypes);



async function loadStates() {
  return new Promise((resolve, reject) => {
    const states = [];
    fs.createReadStream('./dataLoad/data/states.csv')
      .pipe(csv())
      .on('data', (row) => {
        states.push(row);
      })
      .on('end', () => {
        resolve(states);
      })
      .on('error', reject);
  });
}


async function loadCities() {
  return new Promise((resolve, reject) => {
    const cities = [];
    fs.createReadStream('./dataLoad/data/city.csv')
      .pipe(csv())
      .on('data', (row) => {
        cities.push(row);
      })
      .on('end', () => {
        resolve(cities);
      })
      .on('error', reject);
  });
}

async function loadStatesAndCities() {
  await sequelize.sync({ force: true });
  const stateIdMap = []

  process.stdout.write('Loading States into Memory <<=================\n\r')
  const states = await loadStates();
  process.stdout.write(`States in memory = ${states.length}\n\r`)

  var transaction = await sequelize.transaction(); 
  var ctr = 0;
  var ctrTrans = 0;
  for (const state of states) {
    const createdState = await sequelize.models.State.create({
      Name: state.Name,
      Acronym: state.Acronym,
      Cod_State: state.Cod_State
    },{ transaction });
    stateIdMap[state.Cod_State] = createdState.ID_State;
    ctr++
    process.stdout.write(`${ctr}\r`)
    ctrTrans++;
    if (ctrTrans >= 1000) {
      await transaction.commit(); 
      transaction = await sequelize.transaction(); 
      console.log('Çomitou')
      ctrTrans = 0;
    }
  }
  if (ctrTrans > 0) {
    console.log('Çomitou2')
    await transaction.commit(); 
    const transaction = await sequelize.transaction(); 
    ctrTrans = 0;
  }
  process.stdout.write(`${ctr} States included in the DB\n\r`)

  ctr = 0;
  process.stdout.write('\n\rLoading Cities into memory <<=================\n\r')
  const cities = await loadCities();
  process.stdout.write(`${cities.length} Cidades em memória\n\r`)
  for (const city of cities) {
    if (stateIdMap[city.Cod_State]) {
      await sequelize.models.City.create({
        Name: city.Name,
        Cod_City: city.Cod_City,
        Cod_State: city.Cod_State,
        ID_State: stateIdMap[city.Cod_State]
      },{ transaction });
      ctr++
      process.stdout.write(`${ctr}\r`)
      ctrTrans++;
      if (ctrTrans >= 1000) {
        await transaction.commit(); 
        const transaction = await sequelize.transaction(); 
        ctrTrans = 0;
      }
    }
  }
  if (ctrTrans > 0) {
    await transaction.commit(); 
    ctrTrans = 0;
  }
  process.stdout.write(`${ctr} Cities included in the DB\n\r`)
}



  process.stdout.write('States and Cities have been loaded successfully.\n\r');

loadStatesAndCities().catch(err => {
  console.error('Failed to load states and cities:', err);
});
