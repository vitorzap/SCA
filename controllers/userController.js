const { User, Client, Teacher } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const yup = require('yup');

const createUserSchema = yup.object().shape({
  UserName: yup.string().required(),
  UserEmail: yup.string().email().required(),
  UserPassword: yup.string().required(),
  UserType: yup.string().oneOf(['Root','Admin']).required(),
});

const updateUserSchema = yup.object().shape({
  UserName: yup.string().optional(),
  UserEmail: yup.string().email().optional(),
  UserType: yup.string().oneOf(['Root', 'Admin']).optional(),
});

const userController = {
  createUser: async (req, res) => {
    try {
      const { UserName, UserEmail, UserPassword, UserType } = req.body;
      const { ID_Company } = req.user; // Obtém ID_Company do req.user

      await createUserSchema.validate({ UserName, UserEmail, UserPassword, UserType });
      const userExists = await User.findOne({
        where: {
          [Op.or]: [
            { UserName: UserName },
          ],
          ID_Company: ID_Company
        }
      });

      if (userExists) {
        return res.status(400).json({ error: 'User name or email already exists.' });
      }
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
      console.log('USER EXISTS - 4');
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

  getUsersByName: async (req, res) => {
    try {
      let { name } = req.params;
      const { ID_Company, UserType } = req.user; // Obtém ID_Company e UserType do usuário logado
  
      let whereCondition;
  
      if (name.startsWith('*') && name.endsWith('*')) {
        name = name.substring(1, name.length - 1);
        whereCondition = {
          UserName: { [Op.like]: `%${name}%` } // Contém
        };
      } else if (name.startsWith('*')) {
        name = name.substring(1);
        whereCondition = {
          UserName: { [Op.like]: `%${name}` } // Termina com
        };
      } else if (name.endsWith('*')) {
        name = name.substring(0, name.length - 1);
        whereCondition = {
          UserName: { [Op.like]: `${name}%` } // Começa com
        };
      } else {
        whereCondition = {
          UserName: name // Igualdade exata
        };
      }
  
      // Adicionando filtro de companhia se o usuário não for Root
      if (UserType !== 'Root') {
        whereCondition.ID_Company = ID_Company;
      }
  
      const users = await User.findAll({ where: whereCondition });
  
      if (users.length > 0) {
        res.json(users);
      } else {
        res.status(404).json({ error: 'No users found matching criteria.' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id } = req.params;     
      // const { UserName, UserEmail, UserType } = req.body;
      const { UserName, UserEmail, UserType } = req.body;
      const { ID_Company } = req.user; // Obtém ID_Company do req.user

      await updateUserSchema.validate({ UserName, UserEmail, UserType });

      const conditions = [];
      if (UserName) conditions.push({ UserName });
      if (UserEmail) conditions.push({ UserEmail });

      // Verificar se UserName ou UserEmail já existem para outro usuário na mesma companhia
      const existingUser = await User.findOne({
        where: {
          ID_Company,
          [Op.or]: conditions,
          UserID: { [Op.ne]: id } // Exclui o próprio usuário da verificação
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'UserName or UserEmail already in use by another user in your company.' });
      }

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


      // Primeiro, verifica se o usuário existe e se o UserType é "Other"
      const user = await User.findOne({
        where: { UserID: id, ID_Company }
      });
 
      // Se o usuário não for encontrado, retorna um erro
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Se o UserType for "Other", impede a exclusão
      if (user.UserType != 'Admin' && user.UserType != 'Root') {
        return res.status(403).json({ error: 'Deleting users of this type is not allowed.' });
      }

      // Verificar associações antes da exclusão
      const clientOrTeacher = await Promise.all([
        Client.findOne({ where: { UserID: id } }),
        Teacher.findOne({ where: { UserID: id } })
      ]);
      if (clientOrTeacher[0] || clientOrTeacher[1]) {
        return res.status(400).json({ error: 'Cannot delete user associated with a client or teacher.' });
      }
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
