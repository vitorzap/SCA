const { Specialty } = require('../models');
const yup = require('yup');

const specialtySchema = yup.object().shape({
  Description: yup.string().required('Description must not be blank'),
});


const specialtyController = {
  createSpecialty: async (req, res) => {
    try {
      const { Description } = req.body;
      const { ID_Company } = req.user;

      await specialtySchema.validate({ Description });

      const newSpecialty = await Specialty.create({ ID_Company,Description });
      res.status(201).json(newSpecialty);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAllSpecialties: async (req, res) => {
    try {

      const { ID_Company } = req.user;

      const specialties = await Specialty.findAll({
        where: { ID_Company }
      });

      res.json(specialties);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },


  getSpecialtyById: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user; // Obtém ID_Company do req.user

      const specialty = await Specialty.findOne({
          where: { ID_Specialties: id, ID_Company }
      });

      if (!specialty) {
        return res.status(404).json({ error: 'Specialty not found' });
      }

      res.json(specialty);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateSpecialty: async (req, res) => {
    try {
      const { id } = req.params;
      const { Description } = req.body;
      const { ID_Company } = req.user; // Obtém ID_Company do req.user

      await specialtySchema.validate({ Description });

      const [updated] = await Specialty.update({ Description }, { 
        where: { ID_Specialties: id, ID_Company } 
      });

      if (updated) {
          const updatedSpecialty = await Specialty.findOne({
            where: { ID_Specialties: id, ID_Company }
          });
          res.json(updatedSpecialty);
        } else {
          res.status(404).json({ error: 'Specialty not found' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteSpecialty: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user; // Obtém ID_Company do req.user

      const deleted = await Specialty.destroy({ 
          where: { ID_Specialties: id, ID_Company } 
      });

      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Specialty not found' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = specialtyController;
