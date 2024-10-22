const { UserType, User } = require('../models');
const { Op } = require('sequelize');
const yup = require('yup');

// YUP schema for UserType validation
const userTypeSchema = yup.object().shape({
  TypeName: yup.string().required().max(50),
  UserTypeLevel: yup.number().required().integer().oneOf([0, 1, 2, 3]).label('UserTypeLevel'),
});

const userTypeController = {
  // Create a new user type
  create: async (req, res) => {
    try {
      const { TypeName, UserTypeLevel } = req.body;

      // Validate request body against schema
      await userTypeSchema.validate({ TypeName, UserTypeLevel });

      // Ensure only one UserType with UserTypeLevel = 0 or 1 exists
      if (UserTypeLevel === 0 || UserTypeLevel === 1) {
        const existingUserType = await UserType.findOne({ where: { UserTypeLevel } });
        if (existingUserType) {
          return res.status(400).json({ error: `Only one UserType with UserTypeLevel = ${UserTypeLevel} is allowed.` });
        }
      }

      const newUserType = await UserType.create({ TypeName, UserTypeLevel });
      res.status(201).json(newUserType);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // List all user types
  listAll: async (req, res) => {
    try {
      const userTypes = await UserType.findAll();
      res.json(userTypes);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get a user type by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const userType = await UserType.findByPk(id);
      if (userType) {
        res.json(userType);
      } else {
        res.status(404).json({ error: 'UserType not found' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update a user type
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { TypeName, UserTypeLevel } = req.body;

      // Validate request body against schema
      await userTypeSchema.validate({ TypeName, UserTypeLevel });

      // Ensure only one UserType with UserTypeLevel = 0 or 1 exists
      if (UserTypeLevel === 0 || UserTypeLevel === 1) {
        const existingUserType = await UserType.findOne({
          where: {
            UserTypeLevel,
            ID_UserType: { [Op.ne]: id } // Exclude the current UserType from the check
          }
        });
        if (existingUserType) {
          return res.status(400).json({ error: `Only one UserType with UserTypeLevel = ${UserTypeLevel} is allowed.` });
        }
      }

      const [updated] = await UserType.update({ TypeName, UserTypeLevel }, { where: { ID_UserType: id } });
      if (updated) {
        const updatedUserType = await UserType.findByPk(id);
        res.json(updatedUserType);
      } else {
        res.status(404).json({ error: 'UserType not found' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete a user type
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if any user is linked to this UserType before deleting
      const linkedUsers = await User.count({ where: { ID_UserType: id } });
      if (linkedUsers > 0) {
        return res.status(400).json({ error: 'Cannot delete UserType because it is referenced by one or more users.' });
      }

      const deleted = await UserType.destroy({ where: { ID_UserType: id } });
      if (deleted) {
        res.json({ message: 'UserType deleted successfully' });
      } else {
        res.status(404).json({ error: 'UserType not found' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = userTypeController;