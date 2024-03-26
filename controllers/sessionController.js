const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const tokenBlacklist = new Set();

const sessionController = {
  login: async (req, res) => {
    try {
      const { UserEmail, UserPassword } = req.body;
      const user = await User.findOne({ where: { UserEmail } });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const match = await bcrypt.compare(UserPassword, user.UserPassword);

      if (!match) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      const token = jwt.sign(
        { 
          id: user.UserID, 
          ID_Company: user.ID_Company, 
          UserType: user.UserType 

        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' });

      res.json({ message: 'Login successful', token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  logout: async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    tokenBlacklist.add(token);
    res.json({ message: 'Logout successful' });
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

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ UserPassword: hashedNewPassword });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = sessionController;
