// controllers/companyController.js
const { Company, Client, Teacher, Specialty, TimeTable, User } = require('../models');
const {  generatePassword } = require('../utils/userHelpers')
const { Op } = require('sequelize'); 
const bcrypt = require('bcrypt');
const configurarTransporter = require('../utils/emailHelpers');
const emailTransporter=configurarTransporter();

const companyController = {
  // Criar uma nova empresa
  createCompany: async (req, res) => {
    try {
      const { Name, AdminEmail } = req.body;
      const newCompany = await Company.create({ Name });
      // Geração da senha randômica
      const adminPassword = generatePassword(8);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
     
      // Criar usuário administrador para a nova empresa
      const newUser = await User.create({
          UserName: 'admin',
          UserEmail: AdminEmail,
          UserPassword: hashedPassword,
          UserType: 'Admin',
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
          `\tPassword: ${adminPassword}\n\n` +
          `Yours sincerely\n` +
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
  getAllCompanies: async (req, res) => {
    try {
      const companies = await Company.findAll();
      return res.json(companies);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  // Buscar uma empresa pelo ID
  getCompanyById: async (req, res) => {
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
  getCompaniesByName: async (req, res) => {
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
  updateCompany: async (req, res) => {
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
  deleteCompany: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar se existem entidades dependentes
      const dependencies = [
        Client.count({ where: { ID_Company: id } }),
        Teacher.count({ where: { ID_Company: id } }),
        Specialty.count({ where: { ID_Company: id } }),
        TimeTable.count({ where: { ID_Company: id } }),
        User.count({ where: { ID_Company: id } })
      ];

      const results = await Promise.all(dependencies);
      const totalDependencies = results.reduce((total, count) => total + count, 0);

      if (totalDependencies > 0) {
        return res.status(400).json({
          error: 'Cannot delete company because it is referenced by other entities.'
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
