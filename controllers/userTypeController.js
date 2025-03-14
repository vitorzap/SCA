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