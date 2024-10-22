// controllers/companyController.js
const { Company, Client, Professional, Specialty, RegularSchedule, Appointment, User} = require('../models');
const { generatePassword, generateSalt } = require('../utils/userHelpers');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const configurarTransporter = require('../utils/emailHelpers');
const emailTransporter = configurarTransporter();
const { getTokenFromHeader,invalidateToken } = require('../utils/authorizationHelper');

const companyController = {
  // Criar uma nova empresa
  create: async (req, res) => {
    try {
      const { Name, AdminEmail } = req.body;
      const newCompany = await Company.create({ Name });

      // Obtém o comprimento da senha do .env, ou usa 10 como padrão se não estiver definido
      const passwordLength = parseInt(process.env.AUTO_GENERATED_PASSWORD_LENGTH) || 10;

      // Gerar senha aleatória
      const password = generatePassword(passwordLength);
      const customSalt = await generateSalt();
      const hashedPassword = await bcrypt.hash(password, customSalt);

      // Criar usuário administrador para a nova empresa
      const newUser = await User.create({
        UserName: 'admin',
        UserEmail: AdminEmail,
        UserPassword: hashedPassword,
        ID_UserType: 1,
        ID_Company: newCompany.ID_Company
      });

      // Preparar a mensagem de e-mail
      const mailOptions = {
        from: process.env.EMAIL_USER,  
        to: AdminEmail,               
        subject: 'Your Admin Account Details',
        text: `Hello,\n\n` +
              `Work environment for Company ${Name} created.\n` +
              `Use the login below to start preparing this environment.\n` +
              `\tLogin: Admin\n` +
              `\tPassword: ${hashedPassword}\n\n` +
              `Yours sincerely,\n` +
              `General system administrator.`
      };

      // Enviar e-mail
      emailTransporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log('Email not sent: ' + error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      return res.status(201).json(newCompany);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  // Listar todas as empresas
  getAll: async (req, res) => {
    try {
      const companies = await Company.findAll();
      return res.json(companies);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  // Buscar uma empresa pelo ID
  getById: async (req, res) => {
    const logMessage = `${req.method} ${req.url} ${JSON.stringify(req.body)}`;

    try {
      const { id } = req.params;
      const company = await Company.findByPk(id);
      if (company) {
        return res.json(company);
      } else {
        return res.status(404).json({ error: 'Company not found.' });
      }
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  // Buscar empresas por nome com suporte a padrões de pesquisa
  getByName: async (req, res) => {
    try {
      let { name } = req.params;
      let whereCondition;

      if (name.startsWith('*') && name.endsWith('*')) {
        name = name.substring(1, name.length - 1);
        whereCondition = {
          Name: { [Op.like]: `%${name}%` } // Contém
        };
      } else if (name.startsWith('*')) {
        name = name.substring(1);
        whereCondition = {
          Name: { [Op.like]: `%${name}` } // Termina com
        };
      } else if (name.endsWith('*')) {
        name = name.substring(0, name.length - 1);
        whereCondition = {
          Name: { [Op.like]: `${name}%` } // Começa com
        };
      } else {
        whereCondition = {
          Name: name // Igualdade exata
        };
      }

      const companies = await Company.findAll({ where: whereCondition });
      if (companies.length > 0) {
        res.json(companies);
      } else {
        res.status(404).json({ error: 'No companies found matching criteria.' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Atualizar uma empresa
  update: async (req, res) => {

    try {
      const { id } = req.params;
      const { Name } = req.body;
      
      const updated = await Company.update({ Name }, {
        where: { ID_Company: id }
      });

      if (updated[0] > 0) {
        const updatedCompany = await Company.findByPk(id);
        return res.json(updatedCompany);
      } else {
        return res.status(404).json({ error: 'Company not found.' });
      }
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  // Excluir uma empresa
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { confirmDeleteAdmin } = req.body; // Adiciona a confirmação como um parâmetro do corpo da requisição
      const loggedUserId = req.user.id

      // Verificar se existem entidades dependentes
      const dependencies = [
        Client.count({ where: { ID_Company: id } }),
        Professional.count({ where: { ID_Company: id } }),
        Specialty.count({ where: { ID_Company: id } }),
        RegularSchedule.count({ where: { ID_Company: id } }),
        Appointment.count({ where: { ID_Company: id } }),
        User.count({ where: { ID_Company: id } })
      ];

      const results = await Promise.all(dependencies);
      const [clientsCount, professionalsCount, specialtiesCount, 
             schedulesCount, appointmentsCount, usersCount] = results;

      const userCount = results[5];
      if (userCount === 1) {
        const aUser = await User.findOne({ 
          where: { ID_Company: id, },
        });

        // Se houver um usuário administrador, verifica a confirmação
        if (aUser && aUser.ID_User === loggedUserId) {
          if (!confirmDeleteAdmin) {
            return res.status(400).json({
              error: 'Confirmation required to delete the admin user along with the company.'
            });
          }


          // Invalida o token do usuário
          const token = getTokenFromHeader(req);
          if (!token) {
            return res.status(401).json({ 
              error: 'Authorization header is required or Token not found in the authorization header' 
            });
          }

          await invalidateToken(token); 
          // Excluir o usuário administrador
          await aUser.destroy();
          results[5] = 0; // Atualiza o contador de usuários
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

      const deleted = await Company.destroy({
        where: { ID_Company: id }
      });

      if (deleted) {
        return res.json({ message: 'Company deleted successfully.' });
      } else {
        return res.status(404).json({ error: 'Company not found.' });
      }
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
};

module.exports = companyController;