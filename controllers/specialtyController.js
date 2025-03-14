const { Specialty, RegularSchedule, Appointment, sequelize } = require('../models');
const yup = require('yup');

const specialtySchema = yup.object().shape({
  Description: yup.string().required('Description must not be blank'),
});

const specialtyController = {
  create: async (req, res) => {
    try {
      const { Description } = req.body;
      const { ID_Company } = req.user;

      await specialtySchema.validate({ Description });

      const newSpecialty = await Specialty.create({ ID_Company, Description });
      res.status(201).json(newSpecialty);
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

      const specialties = await Specialty.findAll({
        where: { ID_Company }
      });

      res.json(specialties);
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

      const specialty = await Specialty.findOne({
        where: { ID_Specialties: id, ID_Company }
      });

      if (!specialty) {
        return res.status(404).json({ error: 'Specialty not found' });
      }

      res.json(specialty);
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { Description } = req.body;
      const { ID_Company } = req.user;

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

      // Verificar associações existentes com ProfessionalSpecialty
      const associatedProfessionals = await sequelize.models.ProfessionalSpecialty.count({
        where: { ID_Specialties: id, ID_Company }
      });

      if (associatedProfessionals > 0) {
        return res.status(400).json({ error: 'Cannot delete specialty because it is associated with professionals.' });
      }

      // Verificar associações com RegularSchedule
      const associatedRegularSchedules = await RegularSchedule.count({
        where: { ID_Specialty: id, ID_Company }
      });

      if (associatedRegularSchedules > 0) {
        return res.status(400).json({ error: 'Cannot delete specialty because it is associated with RegularSchedule.' });
      }

      // Verificar associações com Appointment
      const associatedAppointments = await Appointment.count({
        where: { ID_Specialty: id, ID_Company }
      });

      if (associatedAppointments > 0) {
        return res.status(400).json({ error: 'Cannot delete specialty because it is associated with Appointments.' });
      }

      const deleted = await Specialty.destroy({ 
        where: { ID_Specialties: id, ID_Company } 
      });

      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Specialty not found' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = specialtyController;