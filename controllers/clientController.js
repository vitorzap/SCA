const { Client, User, sequelize } = require('../models');
const bcrypt = require('bcrypt');
const { generateUserName, generatePassword } = require('../utils/userHelpers'); 
const { validateCPF } = require('../utils/verifyingDigitHelper'); 
const yup = require('yup');
const dotenv = require('dotenv');

dotenv.config();

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


const clientController = {
  // Create a new client
    createClient: async (req, res) => {
      const transaction = await sequelize.transaction(); // Inicia uma transação
      try {
        await clientSchema.validate(req.body);
 
        const { Name, Email, Phone, DateOfBirth, Gender, Street, Complement,
                District, ID_City, CEP,CPF } = req.body;  
        const { ID_Company } = req.user;

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

        // Obtém o comprimento da senha do .env, ou usa 6 como padrão se não estiver definido
        const passwordLength = parseInt(process.env.AUTO_GENERATED_PASSWORD_LENGTH) || 6;

  
        // Gerar senha aleatória
        const password = generatePassword(passwordLength);
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Tentativa inicial para gerar nome de usuário
        let userName = await generateUserName(Name);
        let userNameExists = await User.findOne({ where: { UserName: userName } }, { transaction });
  
        // Verificar unicidade e ajustar nome de usuário se necessário
        let counter = 1;
        while (userNameExists) {
          userName = await generateUserName(Name, counter);
          userNameExists = await User.findOne({ where: { UserName: userName } }, { transaction });
          counter++;
        }
  
        // Criação do usuário
        const newUser = await User.create({
          UserName: userName,
          UserEmail: Email,
          UserPassword: hashedPassword,
          UserType: 'Client',
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
          UserID: newUser.UserID
        }, { transaction });
  
        await transaction.commit(); // Se tudo ocorrer bem, confirma a transação
        res.status(201).json({ client: newClient, user: newUser });
      } catch (error) {
        await transaction.rollback(); // Em caso de erro, reverte todas as operações da transação
        res.status(400).json({ error: error.message });
      }
    },
 





  // Get all clients
  getAllClients: async (req, res) => {
    try {
      // Usando ID_Company extraído do middleware de autenticação
      const { ID_Company } = req.user;

      const clients = await Client.findAll({
        where: { ID_Company } // Filtragem por companhia
      });

      res.json(clients);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get a client by ID
  getClientById: async (req, res) => {
    try {
      const { id } = req.params;
      // Usando ID_Company extraído do middleware de autenticação
      const { ID_Company } = req.user;

      const client = await Client.findOne({
        where: { ID: id, ID_Company } // Filtragem por ID e companhia
      });

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      res.json(client);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update client data
  updateClient: async (req, res) => {
    const transaction = await sequelize.transaction(); // Inicia uma transação
    try {
      await clientSchema.validate(req.body); // Validação usando o schema Yup

      const { id } = req.params;
      const { Name, Email, Phone, DateOfBirth, Gender, Street, Complement,
              District, ID_City, CEP, CPF } = req.body;
      const { ID_Company } = req.user;

      // Verifica se o ID_City fornecido existe na tabela City
      const cityExists = await City.findByPk(ID_City);
      if (!cityExists) {
        throw new Error('Invalid ID_City. City does not exist.');
      }

      // Verificar se o CPF já existe para outro cliente
      const cpfExists = await Client.findOne({
        where: {
          CPF,
          ClientID: { [Sequelize.Op.ne]: id } // Verifica se o CPF pertence a outro cliente
        },
        transaction
      });

      if (cpfExists) {
        throw new Error('CPF already registered for another client.');
      }  


      // Encontra o cliente a ser atualizado para obter seu UserID
      const client = await Client.findOne({
        where: { ClientID: id, ID_Company },
        transaction
      });
  
      if (!client) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Client not found.' });
      }
  
      // Atualiza o cliente
      await Client.update(
        { Name, Email, Phone, DateOfBirth, Gender, Street, Complement,
          District, ID_City, CEP, CPF },
        { where: { ClientID: id, ID_Company } },
        { transaction }
      );
  
      // Atualiza o email do usuário correspondente
      await User.update(
        { UserEmail: Email },
        { where: { UserID: client.UserID, ID_Company } },
        { transaction }
      );
  
      await transaction.commit(); // Se tudo estiver correto, confirma a transação
      res.json({ message: 'Client and corresponding user updated successfully.' });
    } catch (error) {
      await transaction.rollback(); // Em caso de erro, reverte todas as operações da transação
      res.status(400).json({ error: error.message });
    }
  },
  

  // Delete a client
  deleteClient: async (req, res) => {
    const transaction = await sequelize.transaction(); // Inicia uma transação
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;
  
      // Verifica se o cliente existe e pertence à companhia do usuário
      const client = await Client.findOne({
        where: { ClientID: id, ID_Company },
          include: [
            { 
              model: User, 
              as: 'clientInfo',
              required: false 
            },
            {
              model: TimeTable,
              as: 'TimeTables', 
              through: {
                attributes: []
              }
            }
          ],
          transaction
      });

      if (!client) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Client not found.' });
      }

      if (client.TimeTables && client.TimeTables.length > 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cannot delete client because it is associated with time tables.' });
      }

      // Se o cliente tem um user associado, exclui o user
      if (client.clientInfo) {
        await User.destroy({
          where: { UserID: client.clientInfo.UserID },
          transaction
        });
      }

      // Após remover o usuário associado, exclui o cliente
      await Client.destroy({
        where: { ClientID: id },
        transaction
      });
      
      await transaction.commit(); // Confirma a transação se tudo estiver correto
      res.json({ message: 'Client and corresponding user deleted successfully.' });
    } catch (error) {
      await transaction.rollback(); // Reverte a transação em caso de erro
      res.status(400).json({ error: error.message });
    }
  },
  
}

module.exports = clientController;
