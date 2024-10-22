const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

dotenv.config(); // Carrega variáveis de ambiente do arquivo .env

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

// Instância do Sequelize usando a configuração do nosso ambiente
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Importação dos modelos
const User = require('../models/user')(sequelize, DataTypes);
const Professional = require('../models/professional')(sequelize, DataTypes);

// Definição da associação
User.hasOne(Professional, { foreignKey: 'ID_User', as: 'professionalInfo' });
Professional.belongsTo(User, { foreignKey: 'ID_User' });

const passwordLength = parseInt(process.env.AUTO_GENERATED_PASSWORD_LENGTH) || 10; 

async function loadCSV(filePath) {
  process.stdout.write('Loading Professionals <<=================\n\r')
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      process.stdout.write(`${results.length} Professionals em memória\n\r`)
      var ctr=0
      for (const item of results) {
        const transaction = await sequelize.transaction();
        try {
          const userNameInitials = item.UserName.slice(0, 2).toLowerCase();
          const password = userNameInitials + '@123456'; // Custom password
          const hashedPassword = await bcrypt.hash(password, passwordLength); // Criptografa a senha

          // Criação do usuário
          const newUser = await User.create({
            UserName: item.UserName,
            UserEmail: item.UserEmail,
            UserPassword: hashedPassword,
            ID_UserType: 3,
            ID_Company: item[Object.keys(item)[0]]
          }, { transaction });

          // Criação do professor associado ao usuário
          await Professional.create({
            Name: item.Name,
            ID_User: newUser.ID_User,
            ID_Company: item[Object.keys(item)[0]]
          }, { transaction });

          await transaction.commit();
          ctr++

          process.stdout.write(`${ctr}\r`)
        } catch (error) {
          console.error('Error during record insertion:', error);
          await transaction.rollback();
        }
      }
      process.stdout.write(`\n${ctr}Professionals included in the DB\n\r`)
      console.log('Data loaded successfully');
    });
}

const filePath = path.join(__dirname, 'data', 'professionals.csv');
console.log(__dirname)
loadCSV(filePath);
