// repositories/UserRepository.js
const { User, UserType, Professional, Client} = require('../models');
const  { generateFlatPassword } = require('../utils/helpers/passwordHelpers');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { error } = require('winston');

class UserRepository {
  async create(userData, transaction = null) {
    console.log('****** userData',userData)
    try {
      if (userData.newName) {
        userData.Usename= await generateUniqueUserName(userData.newName)
      }
      delete userData.newName

      if ('newPassword' in userData) { 
        console.log('newPassword detectada')
        if (userData.newPassword !== null) { 
          userData.UserPassword = await hashPassword(userData.newPassword);
        } else { 
          console.log('gerando NOVA')
          const { hashedPassword } = await generateHashedPassword();
          console.log( 'Create - hashedPassword')
          userData.UserPassword = hashedPassword;
        }
      }
      delete userData.newPassword
      console.log('userData', userData)
      
      const newUser = await User.create(       
        userData,
        transaction ? { transaction } : undefined
      );
      console.log('newUser', newUser.get())
      return { 
        success: true, 
        message: 'User successfully created',
        data: newUser.get(),
        unexpected: false
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.message,
        data: {}, 
        unexpected: true
      }
    }
  }
  
  async findById(ID_User, ID_Company) {
    const user =  User.findOne({
      where: { ID_User, ID_Company },
      include: [{ model: UserType, attributes: ['TypeName', 'UserTypeLevel'] }],
    });
    return { 
      success: user ? true : false, 
      message: user ? "User found" : "User not found",
      data: user,
      unexpected: false
    }
  }
  
  
  async findByUserName(UserName, ID_Company = null) {
    const whereCondition = ID_Company
    ? { UserName, ID_Company} 
    : { UserName };
    const user =  await User.findOne({
      where: whereCondition
    })
    return { 
      success: user ? true : false, 
      message: user ? "User found" : "User not found",
      data: user
    }
  }
  
  async findByEmailOrUsername(UserEmail, UserName, ID_Company) {
    const orConditions = [];
    if (UserName) {
      orConditions.push({ UserName });
    }
    if (UserEmail) {
      orConditions.push({ UserEmail });
    }  
    if (orConditions.length === 0) {
      return null;
    }
    
    const user = User.findOne({
      where: { [Op.or]: orConditions, ID_Company }
    });
    return { 
      success: user ? true : false, 
      message: user ? "User found" : "User not found",
      data: user
    }
  }
  
  async findAllByCompany(ID_Company) {
    try {
      const records = User.findAll({
        where: { ID_Company },
        include: [{ model: UserType, attributes: ['TypeName', 'UserTypeLevel'] }],
      });
      const quantidade = users.length;
      return { 
        success: true, 
        message: `${quantidade} users found`,
        data: {
          records: (records || []).map(record => record.get()),
          count_total: totalCount,          
        },
        unexpected: false
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.message,
        data: [],
        unexpected: true
      }
    }
  }
  
  async update(userData, transaction = null) {
    const idUser = userData.ID_User
    delete  userData.ID_User
    const idCompany = userData.ID_Company;
    delete userData.ID_Company
    delete userData.ID_UserType

    if (userData.newName) {
      userData.UserName = await generateUniqueUserName(userData.newName);
    } 
    delete userData.newName

    if (userData.newPassword) {
      userData.UserPassword = await generateHashedPassword();
    }  
    delete userData.newPassword 
    
    await User.update(userData, {
      where: { ID_User: idUser, ID_Company: idCompany },
      ...(transaction && { transaction }) 
    });

    return { 
      success: true, 
      message: 'Client successfully updated',
      data: {
        ID_User: idUser, 
        ...userData,         
        ID_Company: idCompany
      }
    }
  }

  async delete(ID_User, ID_Company, transaction = null) {
    const user =  await User.findOne({ 
      where: { ID_User, ID_Company } 
    });
    if (!user) {
      return { 
        success: false, 
        message: 'User not found',
        data: null,
        unexpected: false
      }
    }
  }  

  async deleteByFilter(filter, transaction = null) {
    console.log('DELETE BY FILTER')
    try {
      if (!filter) {
        return { 
          success: false, 
          message: 'Filter are required.',
          data: {},
          unexpected: false
        }
      }
      console.log('FILTER', filter, 'FIM FILTER')
      const affectedRows = await User.destroy({
        where: filter,
        transaction: transaction || null,
      });
      console.log('affectedRows', affectedRows)
      return {
        success: true,
        message: `${affectedRows} user(s) deleted successfully.`,
        data: affectedRows, 
        unexpected: false,
      };
    } catch (error) {
      console.error('Unexpected error while deleting users:', error);
      return {
        success: false,
        message: `An unexpected error occurred: ${error.message}`,
        data: null,
        unexpected: true,
      };
    }
  };

  async findClientOrProfessionalByUserId(id) {
    const [client, professional] = await Promise.all([
      Client.findOne({ where: { ID_User: id } }),
      Professional.findOne({ where: { ID_User: id } }),
    ]);
    return { client, professional };
  }


}


// =========================
// General module functions
// =========================

// Function to generate username
function generateUserName(name, counter) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    name = 'user-'; // Substitui o nome vazio por 'user-'
  }
  name = name.trim();

// Split the full name into parts, based on spaces
  const nameParts = name.trim().split(/\s+/);

// Builds the username base using the first name and last name initials
  let baseUserName = nameParts[0];
  if (nameParts.length > 1) {
    for (let i = 1; i < nameParts.length; i++) {
      baseUserName += nameParts[i][0]; // Adiciona a primeira letra de cada sobrenome
    }
  }

// Limit the size of baseUserName to ensure it doesn't exceed the limit after adding the counter
  if (baseUserName.length > 5) {
    baseUserName = baseUserName.substring(0, 5).toLowerCase();
  }

// Add the counter to the baseUserName
  let userName = baseUserName + (counter ? String(counter).padStart(3, '0') : '000');
  
  return userName;
}

// Function to generate unique username
async function generateUniqueUserName(Name) {
  let userName = await generateUserName(Name);
  const { success: userNameExists } = 
      await userRepository.findByUserName(userName);

  let counter = 1;
  while (userNameExists) {
    userName = await generateUserName(Name, counter);
    const { success: userNameExists } =  
      await userRepository.findByUserName(userName);
    counter++;
  }
  return userName;
}

async function generateSalt() {
  const saltRounds = parseInt(process.env.SALTCYCLES) || 10; 
  console.log(`saltRounds=${saltRounds}`)
  try {
    const customSalt = await bcrypt.genSalt(saltRounds)
    return customSalt;
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.error('Error invalidating token:', error.message);
    }
    throw error;
  }
}


async function generateHashedPassword() {
  const passwordLength = parseInt(process.env.AUTO_GENERATED_PASSWORD_LENGTH) || 10;
  console.log(`generateHashedPasswor - passwordLength =${passwordLength}`)
  const password = generateFlatPassword(passwordLength);
  const hashedPassword = await hashPassword(password);
  console.log(`{generateHashedPasswor - password=${password}, hashedPassword=${hashedPassword} };`)

  return { password, hashedPassword };
}

async function hashPassword(password) {
  try {
  console.log(`*hashPassword - hashPassword(password)=${password}`)
  const customSalt = await generateSalt();
  console.log(`*hashPassword - customSalt=${customSalt}`)
  const hashedPassword = await bcrypt.hash(password, customSalt);
  console.log(`hashPassword- hashedPassword)=${hashedPassword}`) 
  console.log(`hashPassword - hashedPassword-saindo`) 
  return hashedPassword;
} catch (error) {
  console.log('SAIU por ERRO')
  console.log(`hash error=${error.message}`)
  return '12345678'
}



}


module.exports = UserRepository;