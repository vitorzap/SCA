const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');

dotenv.config(); // Carrega as variáveis de ambiente do arquivo .env

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

// Criando uma nova instância do Sequelize usando a configuração do nosso ambiente
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Importando modelos
const User = require('../models/user')(sequelize, DataTypes);

const passwordLength = parseInt(process.env.AUTO_GENERATED_PASSWORD_LENGTH) || 10; // Obtém o comprimento da senha do .env ou usa 10 como padrão

async function updateAllUserPasswords() {
    try {
        const users = await User.findAll(); // Busca todos os usuários

        for (const user of users) {
            const userNameInitials = user.UserName.slice(0, 2).toLowerCase(); // Pega as duas primeiras letras do nome do usuário
            const newPassword = `${userNameInitials}@123456`; // Formata a nova senha
            const hashedPassword = await bcrypt.hash(newPassword, passwordLength); // Criptografa a nova senha

            // Atualiza a senha do usuário no banco de dados
            await user.update({ UserPassword: hashedPassword });
        }

        console.log('All user passwords have been updated successfully.');
    } catch (error) {
        console.error('Failed to update user passwords:', error);
    }
}

updateAllUserPasswords(); // Chama a função para atualizar as senhas
