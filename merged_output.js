
// ../.sequelizerc
const path = require('path');

module.exports = {
  config: path.resolve('config', 'config.json'),
  'models-path': path.resolve('models'),
  'seeders-path': path.resolve('seeders'),
  'migrations-path': path.resolve('migrations')
};



// ../config/config.json
{
  "development": {
    "username": "VIXUSER",
    "password": "VIXPASS",
    "database": "PSMS",
    "host": "192.168.0.145",
    "dialect": "mysql",
    "logging": false,
    "operatorsAliases": 0
  },
  "test": {
    "username": "VIXUSER",
    "password": "VIXPASS",
    "database": "PSMS_Test",
    "host": "192.168.0.145",
    "dialect": "mysql",
    "logging": true,
    "operatorsAliases": 0
  },
  "production": {
    "username": "VIXUSER",
    "password": "VIXPASS",
    "database": "SGA_Prod",
    "host": "192.168.0.243",
    "dialect": "mysql",
    "logging": false,
    "operatorsAliases": 0
  }
}


// ../controllers/cityController.js
const { cityRepository } = require('../repositories/');
const BaseController = require('./baseController');



class cityController extends BaseController {
  constructor() {
    super(cityRepository); 
    this.getAllByState = this.getAllByState.bind(this);
    this.getFilter = this.getFilter.bind(this);
    this.getModelsToInclude = this.getModelsToInclude.bind(this);
  }

  createSchema() {
    const newSchema = this.yup.object().shape({
      ID_City: this.yup.number()
      .integer()
      .test(
        'id-city-required',
        'ID_City is mandatory for update and delete actions',
        function (value) {
          console.log('ID_City:',value);
          const { CREATE, UPDATE, DELETE } = this.parent;
          if (CREATE) {                 // If CREATE
            return value === undefined; // ID_City should not be present
          }
          if (UPDATE || DELETE) {       // If UPDATE or DELETE
            console.log('value !== undefined:',(value !== undefined));
            return value !== undefined; // ID_City must exist
          }
          return true; // If none of the above are true, validation passes
        }
      ),
      Name: this.yup.string().required().max(100),
      Cod_State: this.yup.number().required().integer(),
      ID_State: this.yup.number().required().integer(),
      Cod_City: this.yup.number().required().integer(),

    });
    return newSchema;
  }

  createsUniquenessConstraint(inData) {
    const constraints = [];
    if (inData.Name) { constraints.push({ Name: inData.Name }); }
    if (inData.Cod_City) { constraints.push({ Cod_City: inData.Cod_City }); }

    return constraints;
  }

  extraValidations(inData) {
    console.log('Extra validations');
    console.log(inData,JSON.stringify(inData));
    return {
      success: true, 
      message: '', 
      unexpected: false       
    }
  }

  // Method to create filter from req.body
  getFilter(req, filterSelector = null) {
    try {
      if (filterSelector && filterSelector === 'byState') {
          const { ID_State } = req.body;
          if (ID_State === undefined || ID_State === null) {
            return  { 
              success: false, 
              message: 'ID_State is required', 
              data: [], 
              unexpected: false  
            }
          }
          if (!Number.isInteger(Number(ID_State))) {
            return  { 
              success: false, 
              message: 'ID_State must be a valid integer.' , 
              data: [], 
              unexpected: false  
            }
          }
          return  { 
            success: true, 
            message: '' , 
            data:  { ID_State }, 
            unexpected: false  
          }
      } else {
        return  { 
          success: true, 
          message: '' , 
          data:  {}, 
          unexpected: false  
        }
      } 
    } catch (error) {
      return  { 
        success: false, 
        message: error.message, 
        data: [], 
        unexpected: true  
      }
    }
  }


  getModelsToInclude(optionSelector = null) {  
    // optionSelector ='*' => getAll, optionSelector = '*' getById
    if (optionSelector==='*') {
      const includes = [{ model: 'State', attributes: ['Name', 'Acronym']}];
      return includes
    }
    if (optionSelector==='.') {
      const includes = [{ model: 'State' }];
      return includes
    }
    return []; 
 }

  async getAllByState(req, res) {
    return await this.getAll(req, res,'byState' )
  }
}

module.exports = new cityController();

// ../controllers/clientController.js
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

// ../controllers/regularScheduleController.js
const { RegularSchedule, Professional, ProfessionalSpecialties, Specialty, Client, ClientRegularSchedules, Appointment, sequelize } = require('../models');
const { Op } = require('sequelize');
const { eachDayOfInterval, parseISO, setHours, setMinutes, getDay, format } = require('date-fns');
const { checkOverlappingSchedules, checkOverlappingAppointments } = require('../utils/schedule/scheduleHelpers');
const yup = require('yup');

const scheduleSchema = yup.object().shape({
  Day_of_Week: yup.number().required('Day_of_Week is required')
                  .min(0, 'Day_of_Week must be between 0 and 6')
                  .max(6, 'Day_of_Week must be between 0 and 6'),
  Start_Time: yup.string().required('Start_Time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start_Time must be a valid time in HH:MM format'),
  End_Time: yup.string().required('End_Time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End_Time must be a valid time in HH:MM format')
    .test('is-greater', 'End_Time must be later than Start_Time', function (value) {
      const { Start_Time } = this.parent;
      return new Date(`1970-01-01T${value}:00Z`) > new Date(`1970-01-01T${Start_Time}:00Z`);
    }),
  Capacity: yup.number().required('Capacity is required')
               .positive('Capacity must be a number greater than 0'),
  ID_Specialty: yup.number().required('ID_Specialty is required')
                   .integer('ID_Specialty must be a numeric value'),
  ID_Professional: yup.number().required('ID_Professional is required')
                 .integer('ID_Professional must be a numeric value'),
  Start_Date: yup.date().required('Start_Date is required')
                 .typeError('Start_Date must be a valid date'),
  End_Date: yup.date().required('End_Date is required')
                .typeError('End_Date must be a valid date')
                .min(yup.ref('Start_Date'), 'End_Date must be after Start_Date'),
  force: yup.boolean().required('force is required')
            .typeError('force must be true or false')
});

const regularScheduleController = {
  create: async (req, res) => {
    try {
      await scheduleSchema.validate(req.body, { abortEarly: false });

      const { ID_Professional, Day_of_Week, Start_Time, End_Time, Capacity, 
              ID_Specialty, Start_Date, End_Date, OnlyCheck } = req.body;
      const { ID_Company } = req.user;
  
      const professional = await Professional.findOne({ where: { ID_Professional, ID_Company } });
      if (!professional) {
        return res.status(404).json({ message: 'Professional not found.' });
      }

      const specialty = await Specialty.findOne({
        include: [{
          model: Professional,
          as: 'Professionals',
          where: { ID_Professional: professional.ID_Professional },
          through: { model: ProfessionalSpecialties },
          required: true
        }],
        where: { ID_Specialties: ID_Specialty }
      });
  
      if (!specialty) {
        return res.status(400).json({ message: 'Professional does not have the required specialty.' });
      }

      const overlappingSchedules = await checkOverlappingSchedules(
        ID_Professional, Day_of_Week, Start_Time, End_Time, 
        ID_Company, Start_Date, End_Date
      );

      const overlappingAppointments = await checkOverlappingAppointments(
        ID_Professional, Day_of_Week, Start_Time, End_Time, 
        Start_Date, End_Date, ID_Company,  { [Op.ne]: 'canceled' }
      );
  
      if (overlappingSchedules.length > 0 || 
          overlappingAppointments.length > 0) {
        return res.status(400).json({ 
          message: 'The schedule overlaps with existing schedules or appointments for the professional.', 
          overlappingSchedules, 
          overlappingAppointments
        });
      }

      if (OnlyCheck) {
        res.status(201).json({ message: 'No overlappings' });
      } else { 
        const newSchedule = await RegularSchedule.create({
          ID_Professional,
          Day_of_Week,
          Start_Time,
          End_Time,
          Capacity,
          ID_Company,
          ID_Specialty,
          Start_Date,
          End_Date
        });
        res.status(201).json(newSchedule);
      }  
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { Capacity, ID_Professional, Start_Date, End_Date, OnlyCheck } = req.body;
    const { ID_Company } = req.user;
  
    try {
      const existingSchedule = await RegularSchedule.findOne({ where: { ID_RegularSchedule: id, ID_Company } });
      if (!existingSchedule) {
        return res.status(404).json({ message: 'RegularSchedule record not found or does not belong to your company.' });
      }

      const updatedData = { ...existingSchedule.dataValues };
      updatedData.Capacity = Capacity !== undefined ? Capacity : existingSchedule.Capacity;
      updatedData.ID_Professional = ID_Professional !== undefined ? ID_Professional : existingSchedule.ID_Professional;
      updatedData.Start_Date = Start_Date !== undefined ? Start_Date : existingSchedule.Start_Date;
      updatedData.End_Date = End_Date !== undefined ? End_Date : existingSchedule.End_Date;

      await scheduleSchema.validate(updatedData);
  
      const clientCount = await ClientRegularSchedules.count({ where: { ID_RegularSchedule: id } });
      if (clientCount > updatedData.Capacity) {
        return res.status(400).json({ message: 'Capacity cannot be less than the number of associated clients.' });
      }

      const professionalHasSpecialty = await ProfessionalSpecialties.findOne({ 
        where: { ID_Professional: updatedData.ID_Professional, ID_Specialties: updatedData.ID_Specialty }
      });
      if (!professionalHasSpecialty) {
        return res.status(400).json({ message: 'The professional does not have the specified specialty.' });
      }
 
      const overlappingSchedules = await checkOverlappingSchedules(
        ID_Professional, updatedData.Day_of_Week, updatedData.Start_Time, updatedData.End_Time, 
        ID_Company, Start_Date, End_Date, id
      );

      const overlappingAppointments = await checkOverlappingAppointments(
        ID_Professional, updatedData.Day_of_Week, updatedData.Start_Time, updatedData.End_Time, 
        Start_Date, End_Date, ID_Company, { [Op.ne]: 'canceled' }
      );

      if (overlappingSchedules.length > 0 || 
          overlappingAppointments.length > 0) {
        return res.status(400).json({ 
          message: 'The schedule overlaps with existing schedules or appointments for the professional.', 
          overlappingSchedules, 
          overlappingAppointments
        });
      }

      if (OnlyCheck) {
        res.status(201).json({ message: 'No overlappings' });
      } else { 
        const updated = await RegularSchedule.update({
          Capacity: updatedData.Capacity,
          ID_Professional: updatedData.ID_Professional,
          Start_Date: updatedData.Start_Date,
          End_Date: updatedData.End_Date,
        }, {
          where: { ID_RegularSchedule: id, ID_Company }
        });
        
        if (updated[0] > 0) {
          res.status(200).json({ message: 'RegularSchedule record updated successfully.' });
        } else {
          res.status(404).json({ message: 'RegularSchedule record not found or does not belong to your company.' });
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;

      const schedule = await RegularSchedule.findOne({
        where: { ID_RegularSchedule: id, ID_Company }
      });

      if (!schedule) {
        return res.status(404).json({ message: 'RegularSchedule record not found.' });
      }

      const clientAssociations = await ClientRegularSchedules.count({
        where: { ID_RegularSchedule: id }
      });
      if (clientAssociations > 0) {
        return res.status(400).json({ message: 'Cannot delete RegularSchedule with associated clients.' });
      }

      const deleted = await RegularSchedule.destroy({
        where: { ID_RegularSchedule: id, ID_Company }
      });

      if (deleted) {
        res.status(200).json({ message: 'RegularSchedule record deleted successfully.' });
      } else {
        res.status(404).json({ message: 'RegularSchedule record not found.' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;

      const regularSchedule = await RegularSchedule.findOne({
        where: { ID_RegularSchedule: id }
      });

      if (regularSchedule && regularSchedule.ID_Company === ID_Company) {
        res.status(200).json(regularSchedule);
      } else {
        res.status(404).json({ message: 'RegularSchedule not found' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  listByParam: async (req, res) => {
    const { startDate, endDate, ID_Professional, Available_Capacity, 
            daysOfWeek, listProfessional, listSpecialty, listClient } = req.query;
    const { ID_Company } = req.user;

    try {
      const conditions = { ID_Company };
      const include = [];

      if (ID_Professional) {
        const professional = await Professional.findOne({
          where: {
            ID_Professional,
            ID_Company
          }
        });

        if (!professional) {
          return res.status(404).json({ message: 'Professional not found or does not belong to your company.' });
        }

        conditions.ID_Professional = ID_Professional;
      }

      if (Available_Capacity !== undefined) {
        const capacityValue = parseInt(Available_Capacity, 10);
        if (isNaN(capacityValue) || capacityValue < 0) {
          return res.status(400).json({ message: 'Available_Capacity must be a number equal to or greater than 0.' });
        }
        conditions.Capacity = { [Op.gte]: capacityValue + sequelize.col('Current_Clients') };
      }
      
      if (daysOfWeek) {
        const daysOfWeekArray = daysOfWeek.split(',').map(Number);
        const invalidDays = daysOfWeekArray.some(day => isNaN(day) || day < 0 || day > 6);

        if (invalidDays) {
          return res.status(400).json({ message: 'daysOfWeek must be a comma-separated list of integers between 0 and 6.' });
        }

        conditions.Day_of_Week = { [Op.in]: daysOfWeekArray };
      }

      if (startDate || endDate) {
        const parsedStartDate = startDate ? parseISO(startDate) : null;
        const parsedEndDate = endDate ? parseISO(endDate) : null;

        if ((parsedStartDate && isNaN(parsedStartDate)) || (parsedEndDate && isNaN(parsedEndDate))) {
          return res.status(400).json({ message: 'Invalid date format.' });
        }

        if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
          return res.status(400).json({ message: 'endDate must be after or equal to startDate.' });
        }

        if (parsedStartDate) conditions.Start_Date = { [Op.gte]: parsedStartDate };
        if (parsedEndDate) {
          conditions.Start_Date = {
            ...(conditions.Start_Date || {}),
            [Op.lte]: parsedEndDate
          };
        }
      }

      if (listProfessional === 'true') {
        include.push({
          model: Professional,
          as: 'Professional'
        });
      }

      if (listSpecialty === 'true') {
        include.push({
          model: Specialty,
          as: 'Specialty'
        });
      }

      if (listClient === 'true') {
        include.push({
          model: Client,
          as: 'Clients',
          through: { attributes: [] }
        });
      }

      const regularSchedules = await RegularSchedule.findAll({
        where: conditions,
        include: include
      });

      res.json(regularSchedules);
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = regularScheduleController;

// ../controllers/stateController.js
const { stateRepository } = require('../repositories/');
const BaseController = require('./baseController'); 

class stateController extends BaseController {
  constructor() {
    super(stateRepository); 
  }

  createSchema() {
    const newSchema = this.yup.object().shape({
      Name: this.yup.string().required('Name is required').max(100, 'Name must be at most 100 characters long'),
      Acronym: this.yup.string().required('Acronym is required').length(2, 'Acronym must be exactly 2 characters long'),
      Cod_State: this.yup.string().required('Cod_State is required').length(2, 'Cod_State must be exactly 2 characters long')
    });
    return newSchema;
  }

  createsUniquenessConstraint(inData) {
    const constraints = [];
    
    if (inData.Name) { constraints.push({ Name: inData.Name }); }
    if (inData.Acronym ) { constraints.push({ Acronym: inData.Acronym }); }
    if (inData.Cod_State) { constraints.push({ Cod_State: inData.Cod_State }); }

    return constraints;
  }

}

module.exports = new stateController();

// ../controllers/userController copy.js
const { User, Client, Professional, UserType } = require('../models');
// const { Op, JSON } = require('sequelize');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const yup = require('yup');
const { generateHashedPassword } = require('../utils/user/userHelpers');

// Schema for creating a user
const createUserSchema = yup.object().shape({
  UserName: yup.string().required(),
  UserEmail: yup.string().email().required(),
  UserPassword: yup.string().required(),
  ID_UserType: yup.number().required(), // Ensuring UserType is provided
});

// Schema for updating a user
const updateUserSchema = yup.object().shape({
  UserName: yup.string().optional(),
  UserEmail: yup.string().email().optional(),
  ID_UserType: yup.number().optional(), // Optional UserType on update
});

const userController = {
  create: async (req, res) => {
    try {
      const { UserName, UserEmail, UserPassword, ID_UserType } = req.body;
      const { ID_Company } = req.user;

      await createUserSchema.validate({ UserName, UserEmail, UserPassword, ID_UserType });

      // Validate UserTypeLevel based on ID_UserType
      const userType = await UserType.findByPk(ID_UserType);
      if (!userType) {
        return res.status(400).json({ error: 'Invalid UserType provided.' });
      }

      if (userType.UserTypeLevel > 1) {
        return res.status(400).json({ error: 'Dependent user must be created otherwise.' });
      }

      const userExists = await User.findOne({
        where: {
          [Op.or]: [
            { UserName },
            { UserEmail }
          ],
          ID_Company,
        },
      });

      if (userExists) {
        return res.status(400).json({ error: userExists.UserName === UserName ? 'User name already exists.' : 'User email already exists.' });
      }

      const { hashedPassword } = generateHashedPassword();

      const newUser = await User.create({
        UserName,
        UserEmail,
        UserPassword: hashedPassword,
        ID_UserType,
        ID_Company,
      });

      res.status(201).json(newUser);
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const { ID_Company } = req.user;

      const users = await User.findAll({
        where: { ID_Company },
        include: [{ model: UserType, attributes: ['TypeName', 'UserTypeLevel'] }],
      });

      res.json(users);
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;

      const user = await User.findOne({
        where: { ID_User: id, ID_Company },
        include: [{ model: UserType, attributes: ['TypeName', 'UserTypeLevel'] }],
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.json(user);
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  getByName: async (req, res) => {
    try {
      let { name } = req.params;
      const { ID_Company, ID_UserType } = req.user;

      let whereCondition = { UserName: name };

      if (name.includes('*')) {
        whereCondition.UserName = { [Op.like]: name.replace(/\*/g, '%') };
      }

      // Validate UserTypeLevel if ID_UserType is provided in update
      if (ID_UserType) {
        const userType = await UserType.findByPk(ID_UserType);
        if (!userType) {
          return res.status(400).json({ error: 'Invalid UserType provided.' });
        }
        if (userType.UserTypeLevel !== 0) {
          whereCondition.ID_Company = ID_Company;
        }
      }

      const users = await User.findAll({
        where: whereCondition,
        include: [{ 
          model: UserType, 
          attributes: ['TypeName', 'UserTypeLevel'] 
        }],
      });

      if (users.length > 0) {
        res.json(users);
      } else {
        res.status(404).json({ error: 'No users found matching criteria.' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { UserName, UserEmail } = req.body;
      const { ID_Company } = req.user;

      await updateUserSchema.validate({ UserName, UserEmail });
    
      // Ensure at least one field is provided for update
      if (!UserName && !UserEmail) {
        return res.status(400).json({ error: 'No fields provided for update.' });
      }

      const updateFields = {};
      if (UserName) {
          updateFields.UserName = UserName;
      }
      if (UserEmail) {
        updateFields.UserEmail = UserEmail;
      }  

      // Check if either UserName or UserEmail already exists in the company (ignore current user)
      if (Object.keys(updateFields).length > 0) {
        let whereCondition = {
          ID_Company,
          ID_User: { [Op.ne]: id }, // Exclude current user from this check
        };

        if (Object.keys(updateFields).length === 2) {
          whereCondition[Op.or] = [
            { UserName: updateFields.UserName },
            { UserEmail: updateFields.UserEmail }
          ];
        } else {
          // If only one of UserName or UserEmail is present
          whereCondition = {
            ...whereCondition,
            ...updateFields
          };
        }

        const existingUser = await User.findOne({
          where: whereCondition
        });

        if (existingUser) {
          return res.status(400).json({ error: 'UserName or UserEmail already in use by another user in your company.' });
        }
      }

      const updated = await User.update(
        updateFields,
        { where: { ID_User: id, ID_Company } }
      );

      if (updated[0] > 0) {
        const updatedUser = await User.findOne(
          { where: { ID_User: id }, 
            include: [{ model: UserType,
                        attributes: ['TypeName', 'UserTypeLevel'] 
                     }]
          });
        res.json(updatedUser);
      } else {
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

 
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;
  
      const user = await User.findOne({
        where: { ID_User: id, ID_Company },
        include: [{ model: UserType, attributes: ['UserTypeLevel'] }]
      });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      // Check if the UserTypeLevel is NOT 0 or 1
      if (![0, 1].includes(user.UserType.UserTypeLevel)) {
        return res.status(403).json({ error: 'Deleting users of this type is not allowed.' });
      }
  
      const clientOrProfessional = await Promise.all([
        Client.findOne({ where: { ID_User: id } }),
        Professional.findOne({ where: { ID_User: id } })
      ]);
  
      if (clientOrProfessional[0] || clientOrProfessional[1]) {
        return res.status(400).json({ error: 'Cannot delete user associated with a client or Professional.' });
      }
  
      const deleted = await User.destroy({
        where: { ID_User: id, ID_Company }
      });
  
      if (deleted) {
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = userController;

// ../controllers/userController.js
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

// ../controllers/userTypeController.js
// controllers/companyController.js
const { Company, Client, Professional, Specialty, RegularSchedule, Appointment } = require('../models');
const { generateHashedPassword } = require('../utils/user/userHelpers');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const configurarTransporter = require('../utils/helpers/emailHelpers');
const emailTransporter = configurarTransporter();
const { getTokenFromHeader, invalidateToken } = require('../utils/auth/authorizationHelper');
const userRepository = require('../repositories/userRepository'); // Using userRepository

const companyController = {
  create: async (req, res) => {
    try {
      const { Name, AdminEmail } = req.body;
      const newCompany = await Company.create({ Name });

      const { hashedPassword } = generateHashedPassword();

      // Creating the admin user via userRepository
      const newUser = await userRepository.create({
        UserName: 'admin',
        UserEmail: AdminEmail,
        UserPassword: hashedPassword,
        ID_UserType: 1,
        ID_Company: newCompany.ID_Company
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: AdminEmail,
        subject: 'Your Admin Account Details',
        text: `Hello,\n\n` +
              `Work environment for Company ${Name} created.\n` +
              `Use the login below to start preparing this environment.\n` +
              `\tLogin: Admin\n` +
              `\tPassword: ${password}\n\n` +
              `Yours sincerely,\n` +
              `General system administrator.`
      };

      emailTransporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log('Email not sent: ' + error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      return res.status(201).json(newCompany);
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      return res.status(400).json({ error: error.message });
    }
  },

  // Other CRUD methods follow similar changes
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { confirmDeleteAdmin } = req.body;
      const loggedUserId = req.user.id;

      const dependencies = [
        Client.count({ where: { ID_Company: id } }),
        Professional.count({ where: { ID_Company: id } }),
        Specialty.count({ where: { ID_Company: id } }),
        RegularSchedule.count({ where: { ID_Company: id } }),
        Appointment.count({ where: { ID_Company: id } }),
        userRepository.countByCompany(id)
      ];

      const results = await Promise.all(dependencies);
      const [clientsCount, professionalsCount, specialtiesCount, schedulesCount, appointmentsCount, usersCount] = results;

      if (usersCount === 1) {
        const adminUser = await userRepository.findOne({
          where: { ID_Company: id }
        });

        if (adminUser && adminUser.ID_User === loggedUserId) {
          if (!confirmDeleteAdmin) {
            return res.status(400).json({
              error: 'Confirmation required to delete the admin user along with the company.'
            });
          }

          const token = getTokenFromHeader(req);
          if (!token) {
            return res.status(401).json({ error: 'Authorization header is required or Token not found in the authorization header' });
          }

          await invalidateToken(token);
          await userRepository.delete(adminUser.ID_User);  // Deleting user via repository
          results[5] = 0;
        }
      } else {
        return res.status(400).json({
          error: 'Cannot delete company. The user is not the sole admin or does not match the logged-in user.'
        });
      }

      const totalDependencies = results.reduce((total, count) => total + count, 0);
      if (totalDependencies > 0) {
        return res.status(400).json({
          error: 'Cannot delete company because it is referenced by other entities.',
          details: {
            clients: clientsCount,
            professionals: professionalsCount,
            specialties: specialtiesCount,
            regularSchedules: schedulesCount,
            appointments: appointmentsCount,
            users: usersCount
          }
        });
      }

      const deleted = await Company.destroy({ where: { ID_Company: id } });
      return deleted ? res.json({ message: 'Company deleted successfully.' }) : res.status(404).json({ error: 'Company not found.' });

    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      return res.status(400).json({ error: error.message });
    }
  }
};

module.exports = companyController;

// ../models/appointment.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    ID_Appointment: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Start_Time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    End_Time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    Status: {
      type: DataTypes.ENUM('scheduled', 'performed', 'canceled'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    Day_of_Week: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_Client: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Clients',
        key: 'ID_Client'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_Professional: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Professionals',
        key: 'ID_Professional'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_Specialty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Specialties',
        key: 'ID_Specialties'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  }, {
    timestamps: false,
  });

  Appointment.associate = (db) => {
    Appointment.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    Appointment.belongsTo(db.Client, { foreignKey: 'ID_Client' });
    Appointment.belongsTo(db.Professional, { foreignKey: 'ID_Professional' });
    Appointment.belongsTo(db.Specialty, { foreignKey: 'ID_Specialty' });
  };

  return Appointment;
};

// ../models/city.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const City = sequelize.define('City', {
    ID_City: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    Cod_State: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },
    Cod_City: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    ID_State: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'States',
        key: 'ID_State'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  }, {
    timestamps: false, 
  });

  City.associate = (db) => {
    City.belongsTo(db.State, { foreignKey: 'ID_State' });
    City.hasMany(db.Client, { foreignKey: 'ID_City' });
  };

  return City;
};

// ../models/client.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    ID_Client: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    Email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    Phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    DateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    Gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true,
    },
    CPF: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
    },
    Street: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    Complement: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    District: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    CEP: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    RegistrationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_User: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'ID_User'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    ID_City: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Cities',
        key: 'ID_City'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  },  {
    timestamps: false,
  });

  Client.associate = (db) => {
    Client.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    Client.belongsTo(db.User, { foreignKey: 'ID_User' });
    Client.belongsTo(db.City, { foreignKey: 'ID_City' });
    Client.hasMany(db.ClientRegularSchedule, { foreignKey: 'ID_Client' });
    Client.hasMany(db.Appointment, { foreignKey: 'ID_Client' });
  };

  return Client;
};

// ../models/clientRegularSchedule.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const ClientRegularSchedule = sequelize.define('ClientRegularSchedule', {
    ID_ClientRegularSchedules: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_Client: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Clients',
        key: 'ID_Client'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_RegularSchedule: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'RegularSchedules',
        key: 'ID_RegularSchedule'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  }, {
    timestamps: false,
  });

  ClientRegularSchedule.associate = (db) => {
    ClientRegularSchedule.belongsTo(db.Client, { foreignKey: 'ID_Client' });
    ClientRegularSchedule.belongsTo(db.RegularSchedule, { foreignKey: 'ID_RegularSchedule' });
  };

  return ClientRegularSchedule;
};

// ../models/company.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    ID_Company: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    }
  },  {
    timestamps: false,
  });
  
  Company.associate = (db) => {
    Company.hasMany(db.User, { foreignKey: 'ID_Company' });
    Company.hasMany(db.Professional, { foreignKey: 'ID_Company' });
    Company.hasMany(db.Client, { foreignKey: 'ID_Company' });
    Company.hasMany(db.Specialty, { foreignKey: 'ID_Company' });
    Company.hasMany(db.RegularSchedule, { foreignKey: 'ID_Company' });
  };

  return Company;
};

// ../models/professionalSpecialty.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const ProfessionalSpecialty = sequelize.define('ProfessionalSpecialty', {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_Professional: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Professionals',
        key: 'ID_Professional'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_Specialties: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Specialties',
        key: 'ID_Specialties'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  },  {
    timestamps: false,
  });

  ProfessionalSpecialty.associate = (db) => {
    ProfessionalSpecialty.belongsTo(db.Professional, { foreignKey: 'ID_Professional' });
    ProfessionalSpecialty.belongsTo(db.Specialty, { foreignKey: 'ID_Specialties' });
  };

  return ProfessionalSpecialty;
};

// ../models/regularSchedule.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const RegularSchedule = sequelize.define('RegularSchedule', {
    ID_RegularSchedule: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Day_of_Week: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Start_Time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    End_Time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    Capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Current_Clients: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Start_Date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    End_Date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_Professional: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Professionals',
        key: 'ID_Professional'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_Specialty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Specialties',
        key: 'ID_Specialties'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  },  {
    timestamps: false,
  });

  RegularSchedule.associate = (db) => {
    RegularSchedule.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    RegularSchedule.belongsTo(db.Professional, { foreignKey: 'ID_Professional' });
    RegularSchedule.belongsTo(db.Specialty, { foreignKey: 'ID_Specialty' });
    RegularSchedule.hasMany(db.ClientRegularSchedule, { foreignKey: 'ID_RegularSchedule' });
  };

  return RegularSchedule;
};

// ../models/specialty.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Specialty = sequelize.define('Specialty', {
    ID_Specialties: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Description: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  },  {
    timestamps: false,
  });

  Specialty.associate = (db) => {
    Specialty.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    Specialty.hasMany(db.ProfessionalSpecialty, { foreignKey: 'ID_Specialties' });
    Specialty.hasMany(db.RegularSchedule, { foreignKey: 'ID_Specialty' });
    Specialty.hasMany(db.Appointment, { foreignKey: 'ID_Specialty' });
  };

  return Specialty;
};

// ../models/state.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const State = sequelize.define('State', {
    ID_State: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    Acronym: {
      type: DataTypes.STRING(2),
      allowNull: false,
      unique: true,
    },
    Cod_State: {
      type: DataTypes.STRING(2),
      allowNull: false,
      unique: true,
    }
  }, {
    timestamps: false, 
  });

  State.associate = (db) => {
    State.hasMany(db.City, { foreignKey: 'ID_State' });
  };

  return State;
};

// ../models/user.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    ID_User: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    UserName: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    UserEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: 'unique_company_user_email'
    },
    UserPassword: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ID_UserType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'UserTypes',
        key: 'ID_UserType'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    ID_Company: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'ID_Company'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    },
    token_version: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    }
  }, {
    timestamps: false,
  });

  User.associate = (db) => {
    User.belongsTo(db.Company, { foreignKey: 'ID_Company' });
    User.belongsTo(db.UserType, { foreignKey: 'ID_UserType' });
    User.hasOne(db.Professional, { foreignKey: 'ID_User' });
    User.hasOne(db.Client, { foreignKey: 'ID_User' });
  };
  
  return User;
};

// ../models/userType.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserType = sequelize.define('UserType', {
    ID_UserType: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    TypeName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    UserTypeLevel: {
      type: DataTypes.INTEGER,
      allowNull: false, // ou allowNull: true, dependendo da necessidade
    }
  },  {
    timestamps: false,
  });

  UserType.associate = (db) => {
    UserType.hasMany(db.User, { foreignKey: 'ID_UserType' });
  };

  return UserType;
};

// ../repositories/appointmentRepository.js
// repositories/appointmentRepository.js
const { Appointment } = require('../models');

class AppointmentRepository {
  async findByClientId(ID_Client) {
    return await Appointment.findAll({ where: { ID_Client } });
  }
}

module.exports = new AppointmentRepository();

// ../repositories/clientRepository.js
const { Client, User, City, ClientRegularSchedule, Appointment, sequelize } = require('../models');
const { UserRepository } = require('../repositories/');  
const { Op } = require('sequelize');
const { 
        generateUniqueUserName, 
        generateHashedPassword 
      } = require('../utils/user/userHelpers');


class ClientRepository {
  async create(clientData, transaction = null ) {
    userData = { 
      newName: clientData.Name,
      UserEmail: clientData.Email,
      newPassword: null,
      ID_UserType: clientData.ID_UserType,
      ID_Company: clientData.ID_Company
    }
    const allowedKeys = ["Name","Email","Phone","DateOfBirth",
      "Gender","CPF","Street","Complement","District","CEP",
      "RegistrationDate","ID_Company","ID_User","ID_City"];
    for (const key in clientData) { 
      if (!allowedKeys.includes(key)) { delete clientData[key]; }
    }

    const isLocalTransaction = !transaction;
    const currentTransaction = transaction || await sequelize.transaction();
    try {
      const { success, message, data: newUser } 
        = await UserRepository.create(reqData, currentTransaction);
      if (!success) {
        if (isLocalTransaction) { await currentTransaction.rollback();}
        return { success: false, message, data: {} }        
      }
      const newClient = Client.create(clientData, { transaction: transaction });
      if (isLocalTransaction) { await currentTransaction.commit() }
      return { 
        success: true, 
        message: 'Client successfully created',
        data: {
          user: newUser,
          client: newClient
        }
      }
    } catch (error) {
        if (currentTransaction) {
          if (isLocalTransaction) { await currentTransaction.rollback();}
        }
        return { 
          success: false, 
          message: error.message,
          data: {}
        }
    }
  }

  async findAll(filter = {}, onlyCount = false) {
    let count = 0
    try {
      if (onlyCount) {
        count = await Client.count({ where: filter });
        return {
          success: true,
          message: `${count} clients found`,
          data: { count }, 
        } 
      }   
    
      const clients = await Client.findAll({ where: filter });
      count = clients.length;
      return {
        success: true,
        message: `${count} clients found`,
        data: clients,
      };
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while fetching clients',
        data: [],
      };
    }
  }

  async findAllByCompany(ID_Company) {
    const clients = await Client.findAll({ where: { ID_Company } });
    const quantidade = clients.length;
    return { 
      success: true, 
      message: `${quantidade} clients found`,
      data: clients
    }
  }

  async findById(ID_Client, ID_Company) {
    const client =  await Client.findOne({
      where: { ID_Client, ID_Company },
      include: [{ model: User }]
    });
    return { 
      success: client ? true : false, 
      message: client ? "Client found" : "Client not found",
      data: client
    }
  }

  async findByName(name, ID_Company) {
    let whereCondition = { ID_Company };

    if (name.startsWith('*') && name.endsWith('*')) {
      name = name.slice(1, -1);
      whereCondition.Name = { [Op.like]: `%${name}%` }; 
    } else if (name.startsWith('*')) {
      name = name.slice(1);
      whereCondition.Name = { [Op.like]: `%${name}` }; 
    } else if (name.endsWith('*')) {
      name = name.slice(0, -1);
      whereCondition.Name = { [Op.like]: `${name}%` };
    } else {
      whereCondition.Name = name; // Exact match
    }

    const clients = await Client.findAll({ where: whereCondition });
    const quantidade = clients.length;
    return { 
      success: true, 
      message: `${quantidade} clients found`,
      data: clients
    }
  }

  async findByCPF(CPF, ID_Company) {
    const client =  await Client.findOne({where: {
        ID_Company,
        CPF
      },
        include: [{ model: User }]
    });
    return { 
      success: client ? true : false, 
      message: `Client with this CPF ${client ? "found" : "not found"}`,
      data: client
    }
  }  

  async update(clientData, transaction = null) {
    const idClient = clientData.ID_Client
    const idCompany = clientData.ID_Company;
    const idUser = clientData.ID_User;
    let userData
    if (clientData.Name !== clientData.oldName) {
      userData.ID_User = clientData.ID_User
      userData.ID_Company = clientData.ID_Company
      userData.newName = clientData.Name;
    }
    delete clientData.ID_Client;
    delete clientData.ID_Company;
    delete clientData.ID_User; 

    const isLocalTransaction = !transaction;
    const currentTransaction = transaction || await sequelize.transaction();
    try {
      if (userData.Id_User) {
        const { success,  message, dados } = 
          await UserRepository.update(userData,currentTransaction) 
        if (!success) {
          if (isLocalTransaction) { await currentTransaction.rollback();}
          return { success: false, message, dados }        
        }
      }

      await Client.update(clientData, {
        where: { ID_Client: idClient },
        transaction: currentTransaction,
      });
      if (isLocalTransaction) { await currentTransaction.commit() }
      return { 
        success: true, 
        message: 'Client successfully updated',
        data: {
          user: { UserName:  userData.newName },
          client: { ID_Client: idClient, 
                    ...clientData, 
                    ID_Company: idCompany, 
                    ID_User: idUser
                  }
        }
      }
    } catch (error) {
      if (currentTransaction) {
        if (isLocalTransaction) { await currentTransaction.rollback() }
      }
      return { 
        success: false, 
        message: error.message,
        data: {}
      }
    }
  }

  async delete(ID_Client, ID_Company, transaction = null) {
    const client =  await Client.findOne({
       where: { ID_Client, ID_Company } 
    });
    if (!client) {
      return { 
        success: false, 
        message: 'Client not found',
        data: {}
      }
    }

    const isLocalTransaction = !transaction;
    const currentTransaction = transaction || await sequelize.transaction();
    try {
      await Client.destroy({ 
        where: { ID_Client, ID_Company }, 
        currentTransaction 
      });
      await User.destroy({ 
        where: { ID_User: client.ID_User, ID_Company }, 
        currentTransaction 
      });
      if (isLocalTransaction) { await currentTransaction.commit() }
      return { 
        success: true, 
        message: 'Client deleted successfully',
        data: {}
      }         
    } catch (error) {
      if (currentTransaction) {
        if (isLocalTransaction) { await currentTransaction.rollback() }
      }
      return { 
        success: false, 
        message: error.message,
        data: {}
      }
    }
  }

  async findClientWithAssociationsOLD(ID_Client, ID_Company, transaction) {
    return Client.findOne({
      where: { ID_Client, ID_Company },
      include: [
        { model: User, required: false },
        { model: ClientRegularSchedule },
        { model: Appointment }
      ],
      transaction
    });
  }
}

module.exports = new ClientRepository();

// ../repositories/index.js
const cityRepository = require('./cityRepository');
const companyRepository = require('./companyRepository');
const stateRepository = require('./stateRepository');
const userRepository = require('./userRepository');
const userTypeRepository = require('./userTypeRepository');

module.exports = {
  cityRepository,
  companyRepository,
  stateRepository,
  userRepository,
  userTypeRepository
};

// ../repositories/regularScheduleRepository.js
// repositories/regularScheduleRepository.js
const { ClientRegularSchedule } = require('../models');

class RegularScheduleRepository {
  async findByClientId(ID_Client) {
    return await ClientRegularSchedule.findAll({ where: { ID_Client } });
  }
}

module.exports = new RegularScheduleRepository();

// ../repositories/userRepository.js
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


module.exports = new UserRepository();

// ../repositories/userTypeRepository copy.js
const { UserType } = require('../models');

class UserTypeRepository {
  // Find by ID_UserType (Primary Key)
  async findById(ID_UserType) {
    return UserType.findByPk(ID_UserType);
  }

  // Find by TypeName
  async findByTypeName(TypeName) {
    return UserType.findOne({
      where: { TypeName }
    });
  }

  // Find by TypeLevel
  async findByTypeLevel(UserTypeLevel) {
    return UserType.findAll({
      where: { UserTypeLevel }
    });
  }

  // Find by TypeName and TypeLevel
  async findByTypeNameAndLevel(TypeName, UserTypeLevel) {
    return UserType.findOne({
      where: { TypeName, UserTypeLevel }
    });
  }

  // Find all UserTypes
  async findAll() {
    return UserType.findAll();
  }
}

module.exports = new UserTypeRepository();

// ../routes/cityRoutes.js
const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');

const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeByUserLevel } = require('../utils/auth/authorizationHelper');

router.post('/cities', 
            verifyToken, authorizeByUserLevel([0]), 
            cityController.create);
router.get('/cities', 
  verifyToken, authorizeByUserLevel([0]),
  cityController.getAll);
router.get('/cities/bystate',
           verifyToken, authorizeByUserLevel([0]), 
           cityController.getAllByState);
router.get('/cities/:id', 
           verifyToken, authorizeByUserLevel([0]), 
           cityController.getById);
router.put('/cities/:id', 
            verifyToken, authorizeByUserLevel([0]), 
            cityController.update);
router.delete('/cities/:id', 
              verifyToken, authorizeByUserLevel([0]), 
              cityController.delete);

module.exports = router;


// ../routes/clientRegularScheduleRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const clientRegularSchedulesController = require('../controllers/clientRegularSchedulesController');

router.post('/clientRegularSchedules', verifyToken, clientRegularSchedulesController.create);
router.delete('/clientRegularSchedules/:id', verifyToken, clientRegularSchedulesController.delete);
router.get('/clientRegularSchedules/:id', verifyToken, clientRegularSchedulesController.getById);
router.get('/clientRegularSchedules/getbyclient/:ID_Client', verifyToken, clientRegularSchedulesController.getSchedulesByClient);
router.get('/clientRegularSchedules/getbyschedule/:ID_RegularSchedule', verifyToken, clientRegularSchedulesController.getBySchedule);

module.exports = router;

// ../routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeByUserLevel } = require('../utils/auth/authorizationHelper');

router.post('/companies', verifyToken, authorizeByUserLevel([0]), companyController.create);
router.get('/companies', verifyToken, authorizeByUserLevel([0]), companyController.getAll);
router.get('/companies/byname', verifyToken, authorizeByUserLevel([0]), companyController.getByName);
router.get('/companies/:id', verifyToken, authorizeByUserLevel([0]), companyController.getById);
router.put('/companies/:id', verifyToken, authorizeByUserLevel([0]), companyController.update);
router.delete('/companies/:id', verifyToken, authorizeByUserLevel([0]), companyController.delete);

module.exports = router;


// ../routes/professionalRoutes.js
const express = require('express');
const router = express.Router();
const professionalController = require('../controllers/professionalController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/professionals', verifyToken, professionalController.create);
router.get('/professionals', verifyToken, professionalController.getAll);
router.get('/professionals/:id', verifyToken, professionalController.getById);
router.get('/professionals/getbyname/:name', verifyToken, professionalController.getByName);
router.get('/professionals/getbyspecialty/:specialtyId', verifyToken, professionalController.getBySpecialty);
router.put('/professionals/:id', verifyToken, professionalController.update);
router.delete('/professionals/:id', verifyToken, professionalController.delete);
router.put('/professionals/:id/specialties', verifyToken, professionalController.updateSpecialties);

module.exports = router;

// ../routes/regularScheduleRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const regularScheduleController = require('../controllers/regularScheduleController');

router.post('/regularSchedules', verifyToken, regularScheduleController.create);
router.put('/regularSchedules/:id', verifyToken, regularScheduleController.update);
router.delete('/regularSchedules/:id', verifyToken, regularScheduleController.delete);
router.get('/regularSchedules', verifyToken, regularScheduleController.listByParam);
router.get('/regularSchedules/:id', verifyToken, regularScheduleController.getById);

module.exports = router;

// ../routes/sessionRoutes.js
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// No authentication middleware is needed for login
router.post('/login', sessionController.login);

// Logout and changePassword routes require user to be authenticated
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/logout', verifyToken, sessionController.logout);
router.post('/changePassword', verifyToken, sessionController.changePassword);

module.exports = router;


// ../routes/specialtyRoutes.js
const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialtyController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/specialties', verifyToken, specialtyController.create);
router.get('/specialties', verifyToken, specialtyController.getAll);
router.get('/specialties/:id', verifyToken, specialtyController.getById);
router.put('/specialties/:id', verifyToken, specialtyController.update);
router.delete('/specialties/:id', verifyToken, specialtyController.delete);

module.exports = router;


// ../routes/stateRoutes.js
// stateRoutes.js
const express = require('express');
const router = express.Router();
const stateController = require('../controllers/stateController');

router.post('/states', stateController.create); 
router.get('/states', stateController.getAll); 
router.get('/states/:id', stateController.getById);
router.put('/states/:id', stateController.update);
router.delete('/states/:id', stateController.delete);

module.exports = router;


// ../routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware to verify if the user is authenticated
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeByUserLevel } = require('../utils/auth/authorizationHelper');
//router.post('/users', userController.createUser);
router.post('/users', verifyToken, userController.create);
router.get('/users', verifyToken, userController.getAll);
router.get('/users/:id', verifyToken, userController.getById);
router.get('/users/name/:name', verifyToken, 
            authorizeByUserLevel([0,1]), userController.getByName);
router.put('/users/:id', verifyToken, userController.update);
router.delete('/users/:id', verifyToken, userController.delete);

module.exports = router;


// ../utils/debugHelpers.js
function getCallerInfo() {
  const originalFunc = Error.prepareStackTrace;

  let callerFile, previousCallerFile;
  try {
    const err = new Error();
    Error.prepareStackTrace = (err, stack) => stack;
    const currentFile = err.stack.shift().getFileName(); // Get current file (the one calling this function)

    // Loop through the call stack to find the immediate caller and previous caller
    while (err.stack.length) {
      previousCallerFile = callerFile; // Keep track of the previous caller
      callerFile = err.stack.shift().getFileName();
      if (callerFile !== currentFile) break; // Break when finding the first caller outside the current file
    }
  } catch (error) {
    console.error('Error finding the caller module', error);
  } finally {
    Error.prepareStackTrace = originalFunc;
  }

  return { immediateCaller: callerFile, previousCaller: previousCallerFile };
}

module.exports = getCallerInfo;

// ../utils/passwordHelpers.js
function generateFlatPassword(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  console.log(`generateFlatPassword - password=${password}`)
  return password;
}

module.exports = { generateFlatPassword };

// ../utils/redisClient.js
const Redis = require('ioredis');

let redisClient;

if (!redisClient) {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    username: process.env.REDIS_USER || 'default',
    password: process.env.REDIS_PASSWORD || undefined,
  });
}

redisClient.on('connect', () => {
  console.log(`Conectado ao REDIS (`+
               `${redisClient.options.host}:`+ 
               `${redisClient.options.port})`
  );
});

redisClient.on('error', (err) => {
  console.error('Erro ao conectar ao REDIS:', err);
});


module.exports = redisClient;

// ../utils/shutdownHelpers.js
const gracefulShutdown = (server) => {
  return (signal) => {
    console.log(`Received ${signal}, shutting down gracefully...`);

    // Stop accepting new connections
    server.close((err) => {
      if (err) {
        console.error('Error during shutdown:', err);
        process.exit(1); // Exit with error if there's a problem
      }

      console.log('All connections closed, shutting down.');
      process.exit(0); // Exit gracefully
    });

    // Force shutdown after a timeout if connections still active
    setTimeout(() => {
      console.warn('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000); // 10-second grace period
  };
};

module.exports = { gracefulShutdown };

// ../utils/yupHelpers.js
const yup = require('yup');


async function validateData(data, schema) {
  try {
    await schema.validate(data, { abortEarly: false });
    return { success: true, message: '', unexpected: false };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const allMessages = error.inner.map(err => err.message).join('; ');
      return { success: false, message: allMessages, unexpected: false };
    }
    // For unexpected errors
    return {
      success: false,
      message: 'An unexpected error occurred during validation (' +
                error.message + ')',
      unexpected: true
    };
  }
}

function getBaseSchema() {
  return yup.object().shape({
    CREATE: yup
      .boolean()
      .test(
        'mutually-exclusive-create',
        'CREATE, UPDATE, and DELETE are mutually exclusive',
        function (value) {
          const { UPDATE, DELETE } = this.parent;
          return value ? !UPDATE && !DELETE : true;
        }
      ),
    UPDATE: yup
      .boolean()
      .test(
        'mutually-exclusive-update',
        'CREATE, UPDATE, and DELETE are mutually exclusive',
        function (value) {
          const { CREATE, DELETE } = this.parent;
          return value ? !CREATE && !DELETE : true;
        }
      ),
    DELETE: yup
      .boolean()
      .test(
        'mutually-exclusive-delete',
        'CREATE, UPDATE, and DELETE are mutually exclusive',
        function (value) {
          const { CREATE, UPDATE } = this.parent;
          return value ? !CREATE && !UPDATE : true;
        }
      ),
  });
}


module.exports = { yup, validateData, getBaseSchema };





