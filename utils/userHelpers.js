require('dotenv').config(); 

// Função para gerar um salt personalizado
async function generateSalt() {
  const saltRounds = parseInt(process.env.SALTCYCLES) || 10; 
  const customSalt = process.env.SALTSTRING || "genSalt(SaltRounds)"
  return customSalt;
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
  baseUserName = baseUserName.substring(0, 5).toLowerCase();

  // Adiciona o contador ao baseUserName
  let userName = baseUserName + (counter ? String(counter).padStart(3, '0') : '000');
  
  return userName;
}


module.exports = { generateSalt, generateUserName, generatePassword };
