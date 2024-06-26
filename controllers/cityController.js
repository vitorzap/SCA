const { City, State, Client } = require('../models');
const yup = require('yup');

// YUP schema for City validation
const citySchema = yup.object().shape({
  ID_State: yup.number().required(),
  Name: yup.string().required().max(100),
  Cod_State: yup.string().required().length(2),
  Cod_City: yup.string().required().max(10)
});

const cityController = {
  // Create a new City
  createCity: async (req, res) => {
    try {
      const { ID_State, Name, Cod_State, Cod_City } = req.body;

      // Validate request data
      await citySchema.validate({ ID_State, Name, Cod_State, Cod_City });

      // Check if the state exists
      const stateExists = await State.findByPk(ID_State);
      if (!stateExists) {
        return res.status(400).json({ error: 'State not found.' });
      }

      // Uniqueness check for Name and Cod_City within the same state
      const existingCity = await City.findOne({
        where: {
          [Op.and]: [
            { ID_State },
            { [Op.or]: [{ Name }, { Cod_City }] }
          ]
        }
      });
      if (existingCity) {
        return res.status(400).json({ error: 'A city with the same name or code already exists in the state.' });
      }

      // Create city
      const newCity = await City.create({ ID_State, Name, Cod_State, Cod_City });
      res.status(201).json(newCity);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // List all cities or filter by ID_State
  listAllCities: async (req, res) => {
    try {
      const { ID_State } = req.query;
      const filter = ID_State ? { ID_State } : {};

      const cities = await City.findAll({
        where: filter,
        include: [{ model: State }]
      });

      res.json(cities);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get a City by ID
  getCityById: async (req, res) => {
    try {
      const { id } = req.params;
      const city = await City.findByPk(id, { include: [State] });

      if (!city) {
        return res.status(404).json({ error: 'City not found.' });
      }

      res.json(city);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update a City
  updateCity: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_State, Name, Cod_State, Cod_City } = req.body;

      // Validate request data
      await citySchema.validate({ ID_State, Name, Cod_State, Cod_City });

      // Check if the state exists
      const stateExists = await State.findByPk(ID_State);
      if (!stateExists) {
        return res.status(400).json({ error: 'State not found.' });
      }


      // Uniqueness check for Name and Cod_City within the same state excluding the current city
      const existingCity = await City.findOne({
        where: {
          [Op.and]: [
            { ID_State },
            { [Op.or]: [{ Name }, { Cod_City }] },
            { ID_City: { [Op.ne]: id } }
          ]
        }
      });
      if (existingCity) {
        return res.status(400).json({ error: 'Another city with the same name or code already exists in the state.' });
      }      

      // Update city
      const updated = await City.update({ ID_State, Name, Cod_State, Cod_City }, { where: { ID_City: id } });

      if (!updated[0]) {
        return res.status(404).json({ error: 'City not found.' });
      }

      res.json({ message: 'City updated successfully.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete a City
  deleteCity: async (req, res) => {
    try {
      const { id } = req.params;

      // Check for associated Clients before deletion
      const clients = await Client.findAll({ where: { ID_City: id } });
      if (clients.length > 0) {
        return res.status(400).json({ error: 'City cannot be deleted as it has associated clients.' });
      }

      // Delete city
      const deleted = await City.destroy({ where: { ID_City: id } });

      if (!deleted) {
        return res.status(404).json({ error: 'City not found.' });
      }

      res.json({ message: 'City deleted successfully.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = cityController;
