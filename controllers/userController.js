// controllers/userController.js
const { UserRepository, UserTypeRepository } = require('../repositories/');  
const { validateData } = require ('../utils/validation/yupHelpers')
const yup = require('yup')

const userController = {
  create: async (req, res) => {
    try {
      const { UserName, newName, UserEmail, 
              UserPassword, newPassword, ID_UserType } = req.body;
      const { ID_Company } = req.user;

      const reqData = { UserName, newName, UserEmail, 
                        UserPassword, newPassword,
                        ID_UserType, ID_Company }

      const { success, message: validationMessage } = await validateUser(reqData)
      if (!success) {
        console.log(`success=${success} \n validationMessage=${message}`)
        return res.status(400).json({ message: validationMessage });
      }

      const createResult = await UserRepository.create(reqData);
      console.log(`success=${success} \n`+
        `message=${createResult.message} \n`+
        `dados= ${JSON.stringify(createResult.dados)}`
      )
      if (!createResult.success) {
         res.status(400).json({ message: createResult.message });
      }
      res.status(201).json({ 
        message: createResult.message, 
        data: createResult.data 
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ message: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const { ID_Company } = req.user;
      const findResult = await UserRepository.findAllByCompany(ID_Company);
      if (!findResult.success) {
        res.status(400).json({ message: findResult.message });
      }
      res.status(201).json({  
        message: findResult.message, 
        data: findResult.data 
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('message:', error);
      }
      res.status(400).json({ message: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;
      const findResult = await UserRepository.findById(id, ID_Company);
      if (!findResult.success) {
        res.status(404).json({ message: findResult.message });
      }
      res.json({ 
        message: findResult.message, 
        data: findResult.data
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('message:', error.message);
      }
      res.status(400).json({ message: error.message });
    }
  },

  getByName: async (req, res) => {
    try {
      const { name } = req.params;
      const { ID_Company } = req.user;

      const findResult = await UserRepository.findByUserName(name, ID_Company);
      if (!findResult.success) {
        res.status(404).json({ message: findResult.message });
      }
      res.json({ 
        message: findResult.message, 
        data: findResult.data
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('message:', error.message);
      }
      res.status(400).json({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;
      const { UserName, newName, UserEmail, 
            UserPassword, newPassword } = req.body;
      const reqData =   { UserName, newName, UserEmail, 
                          UserPassword, newPassword } 
      for (const key in reqData) { reqData[key] ?? delete reqData[key];}

      const findUniqueResult = await UserRepositoryRepository.findById(id, ID_Company);
        if (!findUniqueResult.success) {
          res.status(404).json({ message: findMessage });
        }

      const userData = Object.assign({}, fetchedUser, reqData )

      const validationResult = await validateUser(userData)
      if (!validationResult.success) {
        console.log(`success=${validationResult.success} \n validationMessage=${validationResult.message}`)
        return res.status(400).json({ message: validationResult.message });
      }
     
      const updateResult = await clientRepository.update(updatedClientData)
      if (!updateResult.success) {
        res.status(400).json({ message: updateResult.message });
      }
      res.status(201).json({ 
        message: updateResult.message, 
        data: updateResult.userData
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('message:', error);
      }      
      res.status(400).json({ message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;

      const deleteResult = await clientRepository.delete(id, ID_Company);
      if (!deleteResult.success) {
        res.status(404).json({ message: deleteResult.message });
      }
      res.json({ message: deleteResult.message });
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ message: error.message });
    }
  },
};


// =========================
// General module functions
// =========================

const userSchema = yup.object().shape({
  newName: yup.string().nullable(),
  UserName: yup.string().nullable(),
  UserEmail: yup.string().email().required(),
  newPassword: yup.string().nullable(), // Allows newPassword to be null
  UserPassword: yup.string().nullable(), // Allows UserPassword to be null
  ID_UserType: yup.number().required(),
}).test(
  'validation-rules',
  'Validation error: Check the rules for newName, UserName, UserPassword, and newPassword.',
  (obj) => {
    const { newName, UserName, newPassword, UserPassword } = obj;

    // Validation 1: At least one of `newName` or `UserName` must be filled
    const isNameValid = !!newName || !!UserName;
    if (!isNameValid) {
      return false;
    }

    // Validation 2: Rules for `newPassword` and `UserPassword`
    // If `UserPassword` is filled, `newPassword` must not exist or must be null
    if (UserPassword) {
      if (newPassword !== null && newPassword !== undefined) {
        return false;
      }
    }

    // If `newPassword` exists, it can coexist with `UserPassword` and can be null
    if (newPassword !== undefined) {
      return true;
    }

    // Passes if all conditions are met
    return true;
  }
);

async function validateUser(userData) {
  try {
    // Validate schema using Yup
    const { success, message: errorMessage } = await validateData(userData, userSchema);
    console.log(`YUP user success=${success}`)
    if (!success) {
      return { success: false, message: errorMessage };
    } 
    // Validating the user type
    const userType = await UserTypeRepository.findById(userData.ID_UserType);
    if (!userType || userType.UserTypeLevel > 1) {
      return { success: false, message: 'Invalid UserType provided.'};
    }

// Checking if another user with this email or UserName already exists in the database
if (userData.UserName || userData.UserEmail) {
  const findUniqueResult = 
    await userRepository.findByEmailOrUsername(
      userData.UserEmail, 
      userData.UserName, 
      userData.ID_Company
    );

  if (findUniqueResult.success) {
    const existingUser = dados;

    // If `ID_User` is present in `userData`, ensure it's not the same user
    if (!userData.ID_User || existingUser.ID_User !== userData.ID_User) {
      return { success: false, message: 'User name or email already exists.' };
    }
  }
}
    return { success: true, message: '' };
  } catch (error) {
    return { success: false,message: 'An unexpected error occurred during validation' };
  }  
}

module.exports = userController;