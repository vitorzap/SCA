const { hashPassword } = require('../utils/user/userHelpers'); 
const userRepository = require('../repositories/userRepository');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { Op } = require('sequelize');
const redisClient = require('../utils/database/redisClient');
const {  getTokenFromHeader ,invalidateToken } = require('../utils/auth/authorizationHelper');

dotenv.config();
const sessionController = {
  login: async (req, res) => {
   try {
      const { login, UserPassword, ID_Company } = req.body;
      const user = await userRepository.findByEmailOrUsername(
        login,login,ID_Company
      );
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
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
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
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(500).json({ error: error.message });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { id, ID_Company } = req.user; // Assuming the user's ID is available from the JWT payload
      const { oldPassword, newPassword } = req.body;

      if (oldPassword === newPassword) {
        return res.status(400).json({ error: 'New password must be different from the old password' });
      }
      const user = await userRepository.findById(id, ID_Company);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const match = await bcrypt.compare(oldPassword, user.UserPassword);

      if (!match) {
        return res.status(401).json({ error: 'Incorrect old password' });
      }

      const updateFields = {
        newPassword: newPassword,
        token_version: user.token_version + 1
      };      

      await  userRepository.update(id, ID_Company, updateFields)

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = sessionController;