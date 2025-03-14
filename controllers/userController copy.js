const { User, Client, Professional, UserType } = require('../models');
// const { Op, JSON } = require('sequelize');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const yup = require('yup');
const { generateHashedPassword } = require('../utils/user/userHelpers');

// Schema for creating a user
const createUserSchema = yup.object().shape({
  UserName: yup.string().required(),
  UserEmail: yup.string().email().required(),
  UserPassword: yup.string().required(),
  ID_UserType: yup.number().required(), // Ensuring UserType is provided
});

// Schema for updating a user
const updateUserSchema = yup.object().shape({
  UserName: yup.string().optional(),
  UserEmail: yup.string().email().optional(),
  ID_UserType: yup.number().optional(), // Optional UserType on update
});

const userController = {
  create: async (req, res) => {
    try {
      const { UserName, UserEmail, UserPassword, ID_UserType } = req.body;
      const { ID_Company } = req.user;

      await createUserSchema.validate({ UserName, UserEmail, UserPassword, ID_UserType });

      // Validate UserTypeLevel based on ID_UserType
      const userType = await UserType.findByPk(ID_UserType);
      if (!userType) {
        return res.status(400).json({ error: 'Invalid UserType provided.' });
      }

      if (userType.UserTypeLevel > 1) {
        return res.status(400).json({ error: 'Dependent user must be created otherwise.' });
      }

      const userExists = await User.findOne({
        where: {
          [Op.or]: [
            { UserName },
            { UserEmail }
          ],
          ID_Company,
        },
      });

      if (userExists) {
        return res.status(400).json({ error: userExists.UserName === UserName ? 'User name already exists.' : 'User email already exists.' });
      }

      const { hashedPassword } = generateHashedPassword();

      const newUser = await User.create({
        UserName,
        UserEmail,
        UserPassword: hashedPassword,
        ID_UserType,
        ID_Company,
      });

      res.status(201).json(newUser);
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const { ID_Company } = req.user;

      const users = await User.findAll({
        where: { ID_Company },
        include: [{ model: UserType, attributes: ['TypeName', 'UserTypeLevel'] }],
      });

      res.json(users);
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;

      const user = await User.findOne({
        where: { ID_User: id, ID_Company },
        include: [{ model: UserType, attributes: ['TypeName', 'UserTypeLevel'] }],
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.json(user);
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  getByName: async (req, res) => {
    try {
      let { name } = req.params;
      const { ID_Company, ID_UserType } = req.user;

      let whereCondition = { UserName: name };

      if (name.includes('*')) {
        whereCondition.UserName = { [Op.like]: name.replace(/\*/g, '%') };
      }

      // Validate UserTypeLevel if ID_UserType is provided in update
      if (ID_UserType) {
        const userType = await UserType.findByPk(ID_UserType);
        if (!userType) {
          return res.status(400).json({ error: 'Invalid UserType provided.' });
        }
        if (userType.UserTypeLevel !== 0) {
          whereCondition.ID_Company = ID_Company;
        }
      }

      const users = await User.findAll({
        where: whereCondition,
        include: [{ 
          model: UserType, 
          attributes: ['TypeName', 'UserTypeLevel'] 
        }],
      });

      if (users.length > 0) {
        res.json(users);
      } else {
        res.status(404).json({ error: 'No users found matching criteria.' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { UserName, UserEmail } = req.body;
      const { ID_Company } = req.user;

      await updateUserSchema.validate({ UserName, UserEmail });
    
      // Ensure at least one field is provided for update
      if (!UserName && !UserEmail) {
        return res.status(400).json({ error: 'No fields provided for update.' });
      }

      const updateFields = {};
      if (UserName) {
          updateFields.UserName = UserName;
      }
      if (UserEmail) {
        updateFields.UserEmail = UserEmail;
      }  

      // Check if either UserName or UserEmail already exists in the company (ignore current user)
      if (Object.keys(updateFields).length > 0) {
        let whereCondition = {
          ID_Company,
          ID_User: { [Op.ne]: id }, // Exclude current user from this check
        };

        if (Object.keys(updateFields).length === 2) {
          whereCondition[Op.or] = [
            { UserName: updateFields.UserName },
            { UserEmail: updateFields.UserEmail }
          ];
        } else {
          // If only one of UserName or UserEmail is present
          whereCondition = {
            ...whereCondition,
            ...updateFields
          };
        }

        const existingUser = await User.findOne({
          where: whereCondition
        });

        if (existingUser) {
          return res.status(400).json({ error: 'UserName or UserEmail already in use by another user in your company.' });
        }
      }

      const updated = await User.update(
        updateFields,
        { where: { ID_User: id, ID_Company } }
      );

      if (updated[0] > 0) {
        const updatedUser = await User.findOne(
          { where: { ID_User: id }, 
            include: [{ model: UserType,
                        attributes: ['TypeName', 'UserTypeLevel'] 
                     }]
          });
        res.json(updatedUser);
      } else {
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

 
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;
  
      const user = await User.findOne({
        where: { ID_User: id, ID_Company },
        include: [{ model: UserType, attributes: ['UserTypeLevel'] }]
      });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      // Check if the UserTypeLevel is NOT 0 or 1
      if (![0, 1].includes(user.UserType.UserTypeLevel)) {
        return res.status(403).json({ error: 'Deleting users of this type is not allowed.' });
      }
  
      const clientOrProfessional = await Promise.all([
        Client.findOne({ where: { ID_User: id } }),
        Professional.findOne({ where: { ID_User: id } })
      ]);
  
      if (clientOrProfessional[0] || clientOrProfessional[1]) {
        return res.status(400).json({ error: 'Cannot delete user associated with a client or Professional.' });
      }
  
      const deleted = await User.destroy({
        where: { ID_User: id, ID_Company }
      });
  
      if (deleted) {
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = userController;