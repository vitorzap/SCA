const { Client, User, City, ClientRegularSchedule, Appointment, sequelize } = require('../models');
const bcrypt = require('bcrypt');
const { generateSalt, generateUserName, generatePassword, getUserTypeName, initializeUserTypeIdAndLevel } = require('../utils/userHelpers'); 
const { Op } = require('sequelize');
const { validateCPF } = require('../utils/verifyingDigitHelper'); 
const yup = require('yup');
const dotenv = require('dotenv');

dotenv.config();

// Get the user type name from the filename and initialize the user type ID
const userTypeName = getUserTypeName(__filename);
  
const {userTypeID, userTypeLevel} = initializeUserTypeIdAndLevel(userTypeName);

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

const updateClientSchema = yup.object().shape({
  Name: yup.string().optional(),
  Email: yup.string().email().optional(),
  Phone: yup.string().optional(),
  DateOfBirth: yup.date().nullable().optional(),
  Gender: yup.string().oneOf(['Male', 'Female', 'Other']).nullable().optional(),
  CPF: yup.string().optional()
        .test('is-valid-cpf', 'Invalid CPF', value => value ? validateCPF(value) : true),
  Street: yup.string().nullable().optional(),
  Complement: yup.string().nullable().optional(),
  District: yup.string().nullable().optional(),
  ID_City: yup.number().optional(),
  CEP: yup.string().nullable().optional(),
});

const clientController = {
  // Create a new client
  create: async (req, res) => {
    const transaction = await sequelize.transaction(); // Inicia uma transação
    try {
      await clientSchema.validate(req.body);

      const { Name, Email, Phone, DateOfBirth, Gender, Street, Complement,
              District, ID_City, CEP, CPF } = req.body;  
      const { ID_Company } = req.user;

     // Verifica se userTypeID e userTypeLevel são válidos
     if (userTypeID === -1 || userTypeLevel === -1) {
        return res.status(400).json({ error: `UserType not found for name: ${userTypeName}` });
     }
     if (userTypeLevel < 2) {
      return res.status(400).json({ error: `UserTypeLevel =  ${userTypeLevel} not permitedfound for: ${userTypeName}`  });
     }

      // Verifica se o ID_City fornecido existe na tabela City
      const cityExists = await City.findByPk(ID_City);
      if (!cityExists) {
        throw new Error('Invalid ID_City. City does not exist.');
      }

      // Verificar se o CPF já existe
      const cpfExists = await Client.findOne({ where: { CPF }, transaction });
      if (cpfExists) {
        throw new Error('CPF already registered.');
      }

      // Obtém o comprimento da senha do .env, ou usa 10 como padrão se não estiver definido
      const passwordLength = parseInt(process.env.AUTO_GENERATED_PASSWORD_LENGTH) || 10;

      // Gerar senha aleatória
      const password = generatePassword(passwordLength);
      const customSalt = await generateSalt();
      const hashedPassword = await bcrypt.hash(password, customSalt);
      
      // Tentativa inicial para gerar nome de usuário
      let userName = await generateUserName(Name);
      let userNameExists = await User.findOne({ where: { UserName: userName }, transaction });

      // Verificar unicidade e ajustar nome de usuário se necessário
      let counter = 1;
      while (userNameExists) {
        userName = await generateUserName(Name, counter);
        userNameExists = await User.findOne({ where: { UserName: userName }, transaction });
        counter++;
      }

      // Criação do usuário
      const newUser = await User.create({
        UserName: userName,
        UserEmail: Email,
        UserPassword: hashedPassword,
        UserType: userTypeId,  // Use o ID do UserType inicializado
        ID_Company
      }, { transaction });

      // Criação do cliente associado ao usuário
      const newClient = await Client.create({
        Name,
        Email,
        Phone,
        DateOfBirth, 
        Gender, 
        Street, 
        Complement,
        District, 
        ID_City, 
        CEP,
        CPF,
        ID_Company,
        ID_User: newUser.ID_User
      }, { transaction });

      await transaction.commit(); // Se tudo ocorrer bem, confirma a transação
      res.status(201).json({ client: newClient, user: newUser });
    } catch (error) {
      await transaction.rollback(); // Em caso de erro, reverte todas as operações da transação
      res.status(400).json({ error: error.message });
    }
  },

  // Get all clients
  getAll: async (req, res) => {
    try {
      const { ID_Company } = req.user;

      const clients = await Client.findAll({
        where: { ID_Company }
      });

      res.json(clients);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get a client by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;

      const client = await Client.findOne({
        where: { ID_Client: id, ID_Company },
        include: [{ model: User, as: 'userInfo' }]
      });

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      res.json(client);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get clients by name pattern
  getByName: async (req, res) => {
    try {
      let { name } = req.params;
      const { ID_Company, UserType } = req.user;
      let whereCondition = { ID_Company };

      if (UserType !== 'Root') {
        whereCondition.ID_Company = ID_Company;
      }

      if (name.includes('*')) {
        name = name.replace(/\*/g, '%');
        whereCondition.Name = { [Op.like]: name };
      } else {
        whereCondition.Name = name;
      }

      const clients = await Client.findAll({ where: whereCondition });
      if (clients.length > 0) {
        res.json(clients);
      } else {
        res.status(404).json({ error: 'No clients found matching criteria.' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update client data
  update: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      await updateClientSchema.validate(req.body);

      const { id } = req.params;
      const { ID_Company } = req.user;

      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      });

      if (updates.ID_City) {
        const cityExists = await City.findByPk(updates.ID_City);
        if (!cityExists) {
          throw new Error('Invalid ID_City. City does not exist.');
        }
      }

      if (updates.CPF) {
        const cpfExists = await Client.findOne({
          where: {
            CPF: updates.CPF,
            ID_Client: { [Op.ne]: id }
          },
          transaction
        });

        if (cpfExists) {
          throw new Error('CPF already registered for another client.');
        }
      }

      const client = await Client.findOne({
        where: { ID_Client: id, ID_Company },
        transaction
      });

      if (!client) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Client not found.' });
      }

      await Client.update(updates, {
        where: { ID_Client: id, ID_Company },
        transaction
      });

      if (updates.Email) {
        await User.update(
          { UserEmail: updates.Email },
          { where: { ID_User: client.ID_User, ID_Company }, transaction }
        );
      }

      await transaction.commit();
      res.json({ message: 'Client and corresponding user updated successfully.' });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  },

  // Delete a client
  delete: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;
  
      const client = await Client.findOne({
        where: { ID_Client: id, ID_Company },
        include: [
          { model: User, as: 'userInfo', required: false },
          { model: ClientRegularSchedule, as: 'RegularSchedules', through: { attributes: [] } },
          { model: Appointment, as: 'Appointments' }
        ],
        transaction
      });

      if (!client) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Client not found.' });
      }

      if (client.RegularSchedules && client.RegularSchedules.length > 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cannot delete client because it is associated with RegularSchedules.' });
      }

      if (client.Appointments && client.Appointments.length > 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cannot delete client because it is associated with Appointments.' });
      }

      if (client.userInfo) {
        await User.destroy({
          where: { ID_User: client.userInfo.ID_User },
          transaction
        });
      }

      const deleted = await Client.destroy({
        where: { ID_Client: id },
        transaction
      });

      if (deleted === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'The customer cannot be deleted because the related user cannot be deleted' });
      }
      
      await transaction.commit();
      res.json({ message: 'Client and corresponding user deleted successfully.' });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = clientController;