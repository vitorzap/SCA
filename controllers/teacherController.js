const { Teacher, Specialty, sequelize } = require('../models');
const yup = require('yup');


const teacherSchema = yup.object().shape({
  ID_Company: yup.number().required('Company ID is required'),
  Name: yup.string().required().min(1, 'Name must not be blank'),
});

const teacherController = {
  createTeacher: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { Name, specialtyIds } = req.body;
      const { ID_Company } = req.user; 

      if (!specialtyIds || specialtyIds.length === 0) {
        throw new Error('A teacher must have at least one specialty.');
      }     
  
      // Validate specialties exist
      const specialties = await Specialty.findAll({
        where: { ID_Specialties: specialtyIds }
      }, { transaction: t });
  
      if (specialties.length !== specialtyIds.length) {
        throw new Error('One or more specialties do not exist.');
      }
  
      const teacher = await Teacher.create({ ID_Company, Name }, { transaction: t });
      await teacher.addSpecialties(specialties, { transaction: t });
  
      await t.commit();
      res.status(201).json(teacher);
    } catch (error) {
      await t.rollback();
      res.status(400).json({ error: error.message });
    }
  },
  
  getAllTeachers: async (req, res) => {
    try {
      const { ID_Company } = req.user;
      const teachers = await Teacher.findAll({
        where: { ID_Company }
      });
      res.json(teachers);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getTeacherById: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;

      const teacher = await Teacher.findOne({
        where: { ID_Teacher: id, ID_Company }
      });

      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found or does not belong to this company.' });
      }

      res.json(teacher);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateTeacher: async (req, res) => {
    try {
      const { id } = req.params;
      const { Name } = req.body; // Exemplo de atualização somente do nome
      const { ID_Company } = req.user;

      await updateTeacherSchema.validate({ Name });

      const [updated] = await Teacher.update({ Name }, {
        where: { ID_Teacher: id, ID_Company }
      });

      if (!updated) {
        return res.status(404).json({ message: 'Teacher not found.' });
      }

      const updatedTeacher = await Teacher.findOne({
        where: { ID_Teacher: id, ID_Company }
      });
      res.json(updatedTeacher);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  
  deleteTeacher: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;

      const deleted = await Teacher.destroy({
        where: { ID_Teacher: id, ID_Company }
      });

      if (!deleted) {
        return res.status(404).json({ message: 'Teacher not found or does not belong to this company.' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = teacherController;
