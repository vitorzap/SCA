const clientRepository = require('../repositories/clientRepository');
const cityRepository = require('../repositories/cityRepository');
const yup = require('yup')
const { 
        getUserTypeName, 
        initializeUserTypeIdAndLevel
      } = require('../utils/user/userHelpers'); 
const dotenv = require('dotenv');

dotenv.config();

// Get the user type name from the filename and initialize the user type ID
const userTypeName = getUserTypeName(__filename);
const { userTypeID, userTypeLevel } = initializeUserTypeIdAndLevel(userTypeName);


const clientController = {
  create: async (req, res) => {
    try {
      const { Name, Email, Phone, DateOfBirth, Gender, Street, 
             Complement, District, ID_City, CEP, CPF } = req.body;
      const { ID_Company } = req.user;
      const RegistrationDate = new Date();

      const reqData = {
        Name, Email, CPF, ID_City, Phone, DateOfBirth, Gender, Street,
        Complement, District, CEP, ID_Company, RegistrationDate,
        ID_UserType: userTypeID, UserTypeLevel: userTypeLevel
      };

      const validationResult = await validateClientData(reqData)
      if (!validationResult.success) {
        return res.status(400).json({ message: validationResult.message });
      }
 
      const createClientResult = await clientRepository.create(clientData)
      if (!createClientResult.successsuccess) {
        res.status(400).json({ message: createClientResult.message });
      }
      res.status(201).json({ 
        message: createClientResult.message, 
        data: createClientResult.data
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('message:', error.message);
      }      
      res.status(400).json({ message: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const { ID_Company } = req.user;
      const findResult = 
        await clientRepository.findAllByCompany(ID_Company);
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
      const findResult = await clientRepository.findById(id, ID_Company);
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

  // Get clients by name *** Refazer
  getByName: async (req, res) => {
    try {
      const { name } = req.params;
      const { ID_Company } = req.user;

      const clients = await clientRepository.findByName(name, ID_Company);

      if (clients.length > 0) {
        res.json(clients);
      } else {
        res.status(404).json({ message: 'No clients found matching criteria.' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('message:', error);
      }
      res.status(500).json({ message: error.message });
    }
  },

  // *** refazer 
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;
      const findResult = await clientRepository.findById(id, ID_Company);
      if (!findResult.success) {
        res.status(404).json({ message: findResult.message });
      }

      const updatedClientData = Object.assign(
          {}, 
          { ...fetchedClient, OldName: fetchedClient.Name }, 
          req.body
        );

      const validationResult = await validateClientData(updatedClientData)
      if (!validationResult.success) {
        return res.status(400).json({ message: validationResult.message });
      }
 
      const updateResult = await clientRepository.update(updatedClientData)
      if (!updateResult.success) {
        res.status(400).json({ message: updateResult.message });
      }
      res.status(201).json({ 
        message: updateResult.message, 
        data: updateResult.data
       })
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('message:', error);
      }      
      res.status(400).json({ message: error.message });
    }
  },

  // Delete a client
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;

      const deleteResult = await clientRepository.delete(id, ID_Company, transaction);
      if (!deleteResult.success) {
        res.status(404).json({ message: deleteResult.message });
      }
      res.json({ message: deleteResult.message, data: deleteResult.data });
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('message:', error);
      }
      res.status(400).json({ message: error.message });
    }
  }
};


// =========================
// General module functions
// =========================

const clientSchema = yup.object().shape({
  Name: yup.string().required(),
  Email: yup.string().email().required(),
  Phone: yup.string().optional(),
  DateOfBirth: yup.date().nullable(),
  Gender: yup.string().oneOf(['Male', 'Female', 'Other']).nullable(),
  CPF: yup.string().required("CPF is mandatory")
          .test('is-valid-cpf', 'Invalid CPF', value => validateCPF(value)),
  Street: yup.string().nullable(),
  Complement: yup.string().nullable(),
  District: yup.string().nullable(),
  ID_City: yup.number().required(),
  CEP: yup.string().nullable(),
});

async function validateClientData(clientData) {
  try {
    // Validate schema using Yup
    const { success, message: errorMessage } = await validateData(clientData, clientSchema);
    if (!success) {
      return { success: false, message: errorMessage };
    } 

    const { CPF, ID_City, ID_Company, UserTypeID, UserTypeLevel } = clientData; 
    // User type and level validation
    if (UserTypeID === -1 || UserTypeLevel === -1) {
      return { success: false, message: `UserType not found for name: ${clientData.UserTypeName}` };
    }
    if (UserTypeLevel < 2) {
      return { success: false, message: `UserTypeLevel = ${UserTypeLevel} not permitted for: ${clientData.UserTypeName}` };
    } 
    
    // Check if city exists
    const cityExists = await cityRepository.findById(ID_City);
    if (!cityExists) {
      return { success: false, message: 'Invalid ID_City. City does not exist.' };
    }
  
    // Check for duplicate CPF
    const { success: cpfExists, message, data: clientWithThisCPF } = await clientRepository.findByCPF(CPF, ID_Company);
    if (cpfExists) {
      return { success: false, message: `${message} - ${JSON.stringify(clientWithThisCPF)}`};
    }
 
    return { success: true, message: '' };

  } catch (error) {
    return { success: false,message: 'An unexpected error occurred during validation' };
  }
}


module.exports = clientController;