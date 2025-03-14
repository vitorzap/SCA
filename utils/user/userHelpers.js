require('dotenv').config(); 
const path = require('path');
const bcrypt = require('bcrypt');
const yup = require('yup');
const { validateCPF } = require('../validation/verifyingDigitHelper')
const { validateData } = require ('../validation/yupHelpers')
const userRepository = require('../../repositories/userRepository');


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

  function getUserTypeInfo(ID_UserType) {
    const userType = global.userTypes.find(
      (ut) => ut.ID_UserType === ID_UserType
    );

    if (!userType) {
      throw new Error(`UserType with ID ${ID_UserType} not found`);
    }

    return {
      TypeName: userType.TypeName,
      UserTypeLevel: userType.UserTypeLevel,
    };
  }


  
  
module.exports = { 
                   getUserTypeName, 
                   initializeUserTypeIdAndLevel,
                   getUserTypeInfo
                  };
