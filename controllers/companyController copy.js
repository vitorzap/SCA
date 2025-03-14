const yup = require('yup');
const bcrypt = require('bcrypt');
const { sendEmailbyTemplate } = require('../utils/helpers/emailHelpers');
const { getTokenFromHeader, invalidateToken } = require('../utils/auth/authorizationHelper');
const { companyRepository, userRepository  } = require('../repositories/'); 
const { formatFilter } = require('../utils/formatfilter/filterHelpers')


const companyControllerX = {
  create: async (req, res) => {

    let transaction;
    try {
      const { Name, AdminEmail } = req.body;
      
      const companyData = { Name, AdminEmail, New: true }
      const validationResult  = await validateCompany(companyData)
      if (!validationResult.success) {
        console.log(`success=${success} \n validationMessage=${validationResult.message}`)
        const statusCode = validationResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: validationResult.message,
          error: validationResult.error 
         });
      }

      transaction = await sequelize.transaction();
      const companyCreateResult = await companyRepository.create({ Name }, transaction )
      if (!companyCreateResult.success) {
        await transaction.rollback
        const statusCode = companyCreateResult.unexpected ? 500 : 400;
        res.status(statusCode).json({ 
          message: 'create company: '+ companyCreateResult.message, 
          error: companyCreateResult.error 
        });
      }
//    
//    When including a new company, I must include an administrator user.
      const adminUser = {
        UserName: 'admin',
        UserEmail: AdminEmail,
        ID_UserType: 1,
        ID_Company: companyCreateResult.dados.ID_Company         
      }

      const userCreateResult = await userRepository.create( adminUser,transaction );
       if (!userCreateResult.success) {
        await transaction.rollback
        const statusCode = userCreateResult.unexpected ? 500 : 400;
        res.status(statusCode).json({
          message: 'create admin: '+ userCreateResult.message, 
          error: userCreateResult.error  
        });
      }

      const emailData = {
        subject: 'Your Admin Account Details',
        recipient: AdminEmail,
        companyName: Name,
        password: password,
      }

      const sendMailResult = 
        sendEmailbyTemplate('newAdminAccountMail',  emailData)

      if (!sendMailResult.success) {
        await transaction.rollback
        const statusCode = sendMailResult.unexpected ? 500 : 400;
        res.status(statusCode).json({ 
          message: 'send email: '+ sendMailResult.message, 
          error: sendMailResult.error  
        });       
      }

      await transaction.commit();
      res.status(201).json({
        message: companyCreateResult.message,
        data: companyCreateResult.data,
        unexpected: false,
      })
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      showError(error, { Name, AdminEmail })
      res.status(500).json({ message: error.message, unexpected: true });
    }
  },

  getAll: async (req, res) => {
    try {
      const findResult = await companyRepository.findAll();
      if (!findResult.success) {
        const statusCode = findResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: findResult.message,
          error: findResult.error
        });
      }
      res.status(201).json({ 
        message: findResult.message, 
        data: findResult.data,
        error: findResult.error
      });
    } catch (error) {
      showError(error, {findResult})
      res.status(500).json({ message: error.message, unexpected: true  });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const findResult = await companyRepository.findById(id);
      if (!findResult.success) {
        const statusCode = findResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: findResult.message,
          error: findResult.error
        });
      }
      res.json({ 
        message: findResult.message, 
        data: findResult.data,
        error: findResult.error 
      });
    } catch (error) {
      showError(error, {findResult})
      res.status(500).json({ message: error.message, unexpected: true });
    }
  },

  getByName: async (req, res) => {
    try {
      const { name } = req.params;

      if (name) {
        const filter = formatFilter(name);
      } else {
        return {
          success: false,
          message: 'no search argument specified',
          data: [],
          unexpected: false
        };
      }

      const findResult = await companyRepository.findAll(filter);
      if (!findResult.success) {
        const statusCode = findResult.unexpected ? 500 : 400;
        return res.status(statusCode).json({ 
          message: findResult.message,
          error: findResult.error
        });
      }
      res.json({ 
        message: findResult.message, 
        data: findResult.data,
        error: findResult.error
      })
    } catch (error) {
      showError(error, {findResult})
      res.status(500).json({ message: error.message, unexpected: true  });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { Name } = req.body;

      const updated = await companyRepository.update(id, { Name });
      return updated[0] > 0 ? res.json(await companyRepository.findById(id)) : res.status(404).json({ error: 'Company not found.' });
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      return res.status(400).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { confirmDeleteAdmin } = req.body;
      
      const token = getTokenFromHeader(req);
      if (!token) {
        return res.status(401).json({ error: 'Authorization header is required or Token not found in the authorization header' });
      }
      await invalidateToken(token);
      result = await companyRepository.delete(id, confirmDeleteAdmin );
      if (result.success) {
        console.log(`resul.successt=(${result.success})`)
        res.json({ message: result.message })
      } else {
        res.status(result.status).json({ message: result.message });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      return res.status(400).json({ error: error.message });
    }
  }
}



// =========================
// General module functions
// =========================


const companySchema = yup.object().shape({
  Name: yup.string()
    .max(255, 'Name must be at most 255 characters long')
    .required('Name is required'),
  AdminEmail: yup.string()
    .email('AdminEmail must be a valid email address')
    .when('New', {
      is: true, // Valida apenas se 'New' for true
      then: yup.string().required('AdminEmail is required when New is true'),
      otherwise: yup.string().notRequired(), // Não obrigatório se 'New' for false
    }),
    New: yup.boolean()
    .required('New is required')
    .oneOf([true, false], 'New must be true or false'),
});


async function validateCompany(companyData) {
  try {
      let success = '';
      let message = '';
      let dados = '';
      let newCompany = { ...companyData };
      // If companyData contains ID_Company then it is an update, 
      // and a record with that identifier must exist
      if (newCompany.ID_Company) {
        ({ success, message, data: companyFromDB } = 
            await companyRepository.findById(newCompany.ID_Company));
        if (!success) {
          return { success: false, message };
        }
        newCompany = { ...companyFromDB, ...newCompany };
      }

      // Validate schema using Yup
      const validadeResult = await validateData(newCompany, companySchema);
      if (!success) {
        return validadeResult;
      } 
           
      // Check for uniqueness constraints
      const constraints = [{ Name: newCompany.Name }];
      const excludeId = newCompany.ID_Company || null;

      const findUniqueResult = await companyRepository.findByUniqueConstraints(constraints, excludeId);
      if (findUniqueResult.success) {
        return { success: false, message: 'A company with the same name already exists.' };
      }

      return { success: true, message: '' }
  } catch (error) {
    return { 
      success: false,
      message: 'An unexpected error occurred during validation', 
      unexpected: true 
    };
  } 
}


function filterFields(recordData, allowedFields) {
  if (!Array.isArray(allowedFields)) {
    throw new Error('The allowedFields parameter must be an array.');
  }

  if (typeof recordData !== 'object' || recordData === null) {
    throw new Error('The obj parameter must be a non-null object.');
  }

  return Object.keys(recordData)
    .filter((key) => allowedFields.includes(key))
    .reduce((filteredObj, key) => {
      filteredObj[key] = obj[key];
      return filteredObj;
    }, {});
}






module.exports = companyController;