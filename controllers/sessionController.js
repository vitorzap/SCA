const { User } = require('../models');
const { generateSalt } = require('../utils/userHelpers'); 

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { Op } = require('sequelize');
const redisClient = require('../utils/redisClient');
const {  getTokenFromHeader ,invalidateToken } = require('../utils/authorizationHelper');

dotenv.config();
const sessionController = {
  login: async (req, res) => {
   try {
      const { login, UserPassword, ID_Company } = req.body;
      const user = await User.findOne({ 
        where: {
          [Op.or]: [
            { UserEmail: login },
            { UserName: login }
          ],
          ID_Company: ID_Company
        }
      });
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const match = await bcrypt.compare(UserPassword, user.UserPassword);

      if (!match) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      // Obter userTypeName e userTypeLevel da tabela global userTypes
      const userType = global.userTypes.find(ut => ut.ID_UserType === user.ID_UserType);

      if (!userType) {
        return res.status(400).json({ error: 'Invalid user type.' });
      }

      const { ID_UserType: userTypeID,
              TypeName: userTypeName, 
              UserTypeLevel: userTypeLevel } = userType;

      const token = jwt.sign(
        { 
          id: user.ID_User, 
          ID_Company: user.ID_Company, 
          userTypeID,
          userTypeName,
          userTypeLevel,
          token_version: user.token_version // Include the token_version in the payload
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      res.json({ message: 'Login successful', token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      const token = getTokenFromHeader(req);
      if (!token) {
        return res.status(401).json({ 
          error: 'Authorization header is required or Token not found in the authorization header' 
        });
      }

      // Invalida o token chamando a função de utilidade
      await invalidateToken(token);

      res.json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { id } = req.user; // Assuming the user's ID is available from the JWT payload
      const { oldPassword, newPassword } = req.body;

      if (oldPassword === newPassword) {
        return res.status(400).json({ error: 'New password must be different from the old password' });
      }
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const match = await bcrypt.compare(oldPassword, user.UserPassword);

      if (!match) {
        return res.status(401).json({ error: 'Incorrect old password' });
      }

      // Gerar hash da senha 
      const customSalt = await generateSalt();
      const hashedNewPassword = await bcrypt.hash(newPassword, customSalt);
      // Increment the token_version upon password change
      await user.update({ 
        UserPassword: hashedNewPassword,
        token_version: user.token_version + 1
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = sessionController;