const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');

dotenv.config(); // Load environment variables from .env file

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

// Creating a new Sequelize instance using our configuration
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Definição do modelo da tabela Companies
const Company = sequelize.define('Company', {
  ID_Company: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  Name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'Companies',
  timestamps: false
});

// Função para carregar os dados do arquivo CSV
async function loadCSVData() {
  try {
    process.stdout.write('Loading Compamies into Memory <<=================\n\r')
    // Ler o arquivo CSV
    const csvData = fs.readFileSync('./dataLoad/data/companies.csv', 'utf-8');
    // Dividir linhas do CSV
    const rows = csvData.split('\n').slice(1); //  sIgnorar o cabeçalho
    process.stdout.write(`${rows.length} Companhias em memória\n\r`)

    // Iterar sobre cada linha do CSV
    for (const row of rows) {
      // Dividir os dados da linha por vírgula
      const [Name] = row.split(',');
      // Criar uma nova entrada na tabela Companies
      await Company.create({ Name });
    }

    console.log('Dados carregados com sucesso!');
  } catch (error) {
    console.error('Erro ao carregar dados do arquivo CSV:', error);
  }
}

// Função principal para carregar os dados
async function main() {
  try {

    // Sincronizar o modelo com o banco de dados
    await sequelize.sync();
    // Carregar os dados do arquivo CSV para o banco de dados
    await loadCSVData();
    // Fechar a conexão com o banco de dados
    await sequelize.close();
  } catch (error) {
    console.error('Erro durante a execução do programa:', error);
  }
}

// Chamar a função principal
main();
