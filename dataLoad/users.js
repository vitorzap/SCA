const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');

dotenv.config(); // Load environment variables from .env file

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

// Creating a new Sequelize instance using our configuration
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Importing models
const User = require('../models/user')(sequelize, DataTypes);

// Path to the CSV file
// Obter o diretório pai de __dirname
const parentDir = path.dirname(__dirname);
const filePath = path.join(parentDir, 'dataLoad', 'data', 'users.csv');

const passwordLength = parseInt(process.env.AUTO_GENERATED_PASSWORD_LENGTH) || 10; 

async function loadUsersFromCSV() {
    const results = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', async () => {
            process.stdout.write(`${results.length} Users em memória\n\r`)
            var ctr=0
            for (const item of results) {
                const userNameInitials = item.UserName.slice(0, 2).toLowerCase();
                const password = userNameInitials + '@123456'; // Custom password as described
                const hashedPassword = await bcrypt.hash(password, passwordLength );
                try {
                    const newUser = await User.create({
                        ID_Company: item.ID_Company,
                        UserName: item.UserName,
                        UserEmail: item.UserEmail,
                        UserPassword: hashedPassword,
                        UserType: item.UserType
                    });
                    ctr++;
                    process.stdout.write(`\n${ctr} included in the DB - User created: ${newUser.UserName}\n\r`);
                } catch (error) {
                    console.error('Failed to create user:', error);
                }
            }
            process.stdout.write(`\n${ctr} Users included in the DB\n\r`)
            console.log('Data loaded successfully');
        });
}

loadUsersFromCSV();
