const { State, City } = require('../models');
const yup = require('yup');

// YUP schema for State validation
const stateSchema = yup.object().shape({
  Name: yup.string().required().max(100),
  Acronym: yup.string().required().length(2),
  Cod_State: yup.string().required().length(2)
});

const stateController = {
  // Create a new state
  createState: async (req, res) => {
    try {
      const { Name, Acronym, Cod_State } = req.body;

      // Validate request body against schema
      await stateSchema.validate({ Name, Acronym, Cod_State });
  
      // Check for uniqueness constraints
      const existingState = await State.findOne({
        where: {
          [Op.or]: [
            { Name },
            { Acronym },
            { Cod_State }
          ]
        }
      });
  
      if (existingState) {
        return res.status(400).json({ error: 'A state with the provided name, acronym, or code already exists.' });
      }
      
      const newState = await State.create({ Name, Acronym, Cod_State });
      res.status(201).json(newState);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // List all states
  listAll: async (req, res) => {
    try {
      const states = await State.findAll();
      res.json(states);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get a state by ID
  getStateById: async (req, res) => {
    try {
      const { id } = req.params;
      const state = await State.findByPk(id);
      if (state) {
        res.json(state);
      } else {
        res.status(404).json({ error: 'State not found' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update a state
  updateState: async (req, res) => {
    try {
      const { id } = req.params;
      const { Name, Acronym, Cod_State } = req.body;

      // Validate request body against schema
      await stateSchema.validate({ Name, Acronym, Cod_State });

      // Check for uniqueness constraints
      const existingState = await State.findOne({
        where: {
          [Op.or]: [
            { Name },
            { Acronym },
            { Cod_State }
          ],
          ID_State: { [Op.ne]: id } // Exclude the current state from the check
        }
      });

      if (existingState) {
        return res.status(400).json({ error: 'A state with the provided name, acronym, or code already exists.' });
      }

      const [updated] = await State.update({ Name, Acronym, Cod_State }, { where: { ID_State: id } });
      if (updated) {
        const updatedState = await State.findByPk(id);
        res.json(updatedState);
      } else {
        res.status(404).json({ error: 'State not found' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete a state
  deleteState: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if any city is linked to this state before deleting
      const linkedCities = await City.count({ where: { ID_State: id } });
      if (linkedCities > 0) {
        return res.status(400).json({ error: 'Cannot delete state because it is referenced by one or more cities.' });
      }

      const deleted = await State.destroy({ where: { ID_State: id } });
      if (deleted) {
        res.json({ message: 'State deleted successfully' });
      } else {
        res.status(404).json({ error: 'State not found' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = stateController;
