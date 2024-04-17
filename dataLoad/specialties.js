const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');


dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

// Instância Sequelize
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Importação do modelo
const Specialty = require('../models/specialty')(sequelize, DataTypes);; // Importando o modelo Specialty


// Função para carregar os dados
async function loadCSV(filePath) {
    const results = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            process.stdout.write(`${results.length} Specialties em memória\n\r`)
            var ctr=0
            try {
                for (const item of results) {
                    await Specialty.create({
                        ID_Company: parseInt(item.ID_Company),
                        Description: item.Description
                    });
                    ctr++
                    process.stdout.write(`${ctr}\r`)
                }
                process.stdout.write(`\n${ctr}Specialties included in the DB\n\r`)
                console.log('Specialties have been successfully imported.');
            } catch (error) {
                console.error('Failed to import specialties:', error);
            }
        });
}

// Caminho para o arquivo CSV
const filePath = path.join(__dirname, 'data', 'specialties.csv');
loadCSV(filePath);
