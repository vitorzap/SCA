require('dotenv').config(); 
const path = require('path');
const bcrypt = require('bcrypt');

// Função para gerar um salt personalizado
async function generateSalt() {
  const saltRounds = parseInt(process.env.SALTCYCLES) || 10; 
  try {
    const customSalt = await bcrypt.genSalt(saltRounds)
    return customSalt;
  } catch (error) {
    console.error(('error generating salt:'), error);
    throw error;
  }
}

// Função para gerar password
function generatePassword(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Função para gerar nome de usuário
function generateUserName(name, counter) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    name = 'user-'; // Substitui o nome vazio por 'user-'
  }
  name = name.trim();

  // Divide o nome completo em partes, baseado nos espaços
  const nameParts = name.trim().split(/\s+/);

  // Constrói a base do nome de usuário usando o primeiro nome e as iniciais dos sobrenomes
  let baseUserName = nameParts[0];
  if (nameParts.length > 1) {
    for (let i = 1; i < nameParts.length; i++) {
      baseUserName += nameParts[i][0]; // Adiciona a primeira letra de cada sobrenome
    }
  }

  // Limita o tamanho do baseUserName para garantir que não exceda o limite após adicionar o contador
  if (baseUserName.length > 5) {
    baseUserName = baseUserName.substring(0, 5).toLowerCase();
  }

  // Adiciona o contador ao baseUserName
  let userName = baseUserName + (counter ? String(counter).padStart(3, '0') : '000');
  
  return userName;
}

function getUserTypeName(filename) {
  // Obter o nome do arquivo
  const basename = path.basename(filename);

  // Verificar se o nome do arquivo termina com "Controller.js"
  if (!basename.endsWith('Controller.js')) {
    return null;
  }

  // Remover "Controller.js" do nome do arquivo e capitalizar a primeira letra
  let userTypeName = basename.replace('Controller.js', '');
  userTypeName = userTypeName.charAt(0).toUpperCase() + userTypeName.slice(1);

  return userTypeName;
}

function initializeUserTypeIdAndLevel(userTypeName) {
    // Verificar se a tabela de tipos de usuário foi carregada na memória
    if (!global.userTypes || global.userTypes.length === 0) {
      console.error('UserTypes have not been loaded yet.');
      // return { ID_UserType: -1, userTypeLevel: -1 }; // Retornar erro se a tabela não estiver carregada
    }
  
    // Encontrar o tipo de usuário correspondente ao nome
    const userType = global.userTypes.find(type => type.TypeName === userTypeName);
    if (!userType) {
      console.error(`UserType not found for name: ${userTypeName}`);
      return { ID_UserType: -1, userTypeLevel: -1 }; // Retornar erro se o tipo de usuário não for encontrado
    }
  
    // Retornar um objeto contendo o ID_UserType e o UserTypeLevel
    return { 
      userTypeID: userType.ID_UserType, 
      userTypeLevel: userType.UserTypeLevel 
    }; 
  }




module.exports = { generateSalt, generateUserName, generatePassword, 
                   getUserTypeName, initializeUserTypeIdAndLevel };
