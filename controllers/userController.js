const { User } = require('../models');
const bcrypt = require('bcrypt');
const yup = require('yup');

const userSchema = yup.object().shape({
  UserName: yup.string().required(),
  UserEmail: yup.string().email().required(),
  UserPassword: yup.string().required(),
  UserType: yup.string().oneOf(['Root','Admin', 'Other']).required(),
});

const userController = {
  createUser: async (req, res) => {
    try {
      const { UserName, UserEmail, UserPassword, UserType } = req.body;
      const { ID_Company } = req.user; // Obtém ID_Company do req.user

      await userSchema.validate({ UserName, UserEmail, UserPassword, UserType });

      const hashedPassword = await bcrypt.hash(UserPassword, 10);

      const newUser = await User.create({
        UserName,
        UserEmail,
        UserPassword: hashedPassword,
        UserType,
        ID_Company, // Adiciona ID_Company ao novo registro de usuário
      });

      res.status(201).json(newUser);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const { ID_Company } = req.user; // Obtém ID_Company do req.user

      const users = await User.findAll({
        where: { ID_Company } // Filtra usuários pela companhia do usuário autenticado
      });

      res.json(users);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user; // Obtém ID_Company do req.user

      const user = await User.findOne({
        where: { UserID: id, ID_Company } // Filtra pelo ID do usuário e pela companhia
      });

      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { UserName, UserEmail, UserType } = req.body;
      const { ID_Company } = req.user; // Obtém ID_Company do req.user

      await userSchema.validate({ UserName, UserEmail, UserType });

      const updatedUser = await User.update(
        { UserName, UserEmail, UserType },
        { where: { UserID: id, ID_Company } } // Assegura que a atualização seja feita apenas na companhia correta
      );

      if (updatedUser[0] > 0) {
        res.json({ message: 'User updated successfully' });
      } else {
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user; // Obtém ID_Company do req.user

      const deleted = await User.destroy({
        where: { UserID: id, ID_Company } // Assegura a exclusão apenas na companhia correta
      });

      if (deleted) {
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = userController;
