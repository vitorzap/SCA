const { Teacher, Specialty, sequelize } = require('../models');
const { generateUserName, generatePassword } = require('../utils/userHelpers');
const bcrypt = require('bcrypt');
require('dotenv').config();
const yup = require('yup');


const teacherSchema = yup.object().shape({
  Name: yup.string().required().min(1, 'Name must not be blank'),
});

const teacherController = {
  createTeacher: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { Name, Email, specialtyIds } = req.body;
      const { ID_Company } = req.user; 

      await teacherSchema.validate({ Name });

      if (!specialtyIds || specialtyIds.length === 0) {
        throw new Error('A teacher must have at least one specialty.');
      }     

      // Verificando se as especialidades existem para empresa(Company)
      const specialties = await Specialty.findAll({ 
        where: { 
          ID_Specialties: specialtyIds,
          ID_Company 
        } 
      }, { transaction });

      if (specialties.length !== specialtyIds.length) {
        throw new Error('One or more specialties do not exist for the given company.');
      }     

      // Gera password inicial do usuario
      const passwordLength = parseInt(process.env.AUTO_GENERATED_PASSWORD_LENGTH) || 8; 
      const password = generatePassword(passwordLength);
      const hashedPassword = await bcrypt.hash(password, 10);

      // Gera o nome do usuario baseado no nome to professor
      let userName = await generateUserName(Name); // Tentativa inicial
      let userNameExists = await User.findOne({ where: { UserName: userName } }, { transaction });

      let counter = 1;
      while (userNameExists) {
        userName = await generateUserName(Name, counter);
        userNameExists = await User.findOne({ where: { UserName: userName } }, { transaction });
        counter++;
       }

      // Insere usuario
      const newUser = await User.create({
        UserName: userName,
        UserEmail: Email, // Assumindo que Email é fornecido
        UserPassword: hashedPassword,
        UserType: 'Teacher', // Defina conforme apropriado
        ID_Company
      }, { transaction });

      // Insere professor
      const newTeacher = await Teacher.create({
        UserID: newUser.UserID,
        Name,
        ID_Company
      }, { transaction });

      // Obtendo especialidades correspondentes aos IDs fornecidos
      const specialtiesX = await Specialty.findAll({ where: { id: specialtyIds } });

      // Verificando se todos os IDs fornecidos correspondem a especialidades válidas
      if (specialties.length !== specialtyIds.length) {
        throw new Error('One or more specialties do not exist (*).');
      }

      await newTeacher.addSpecialties(specialties, { transaction });
  
      await transaction.commit();
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
      const listSpecialties = req.query.listSpecialties === 'true'; 

      const includeOptions = [];

      // Se listSpecialties for verdadeiro, inclua o modelo Specialty na busca
      if (listSpecialties) {
        includeOptions.push({
          model: Specialty,
          as: 'Specialties',
          through: { attributes: [] } 
        });
      }

      const teacher = await Teacher.findOne({
        where: { ID_Teacher: id, ID_Company },
        include: includeOptions
      });

      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found or does not belong to this company.' });
      }

      // Preparar resposta incluindo as especialidades, se aplicável
      const response = teacher.toJSON(); // Converter o modelo Sequelize para um objeto simples

      res.json(response);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateTeacher: async (req, res) => {
    try {
      const { id } = req.params;
      const { Name } = req.body; // Exemplo de atualização somente do nome
      const { ID_Company } = req.user;

      await teacherSchema.validate({ Name });

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
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;
      const teacher = await Teacher.findOne({ 
          where: { ID_Teacher: id, ID_Company },
          include: 'Specialties'
        }, { 
          transaction }
      );
      if (!teacher) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Teacher not found.' });
      }

      // Verificar se o professor está associado a algum TimeTable
      const hasTimeTables = await TimeTable.findOne({
        where: { ID_Teacher: teacher.ID_Teacher },
        transaction
      });

      if (hasTimeTables) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cannot delete teacher because they are associated with time tables.' });
      }  

      // Excluir as associações do professor com especialidades
      await teacher.removeSpecialties(teacher.Specialties, { transaction });

      // Excluir o usuário associado ao professor
      await User.destroy({ 
        where: { UserID: teacher.UserID },  
        transaction 
      });

      // Excluir o professor
      await teacher.destroy(
        {where: { ID_Teacher: teacher.ID_Teacher }, 
        transaction 
      });

      await transaction.commit();
      res.json({ message: 'Teacher and corresponding user deleted successfully.' });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  },
};

const updateSpecialty = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { ID_Teacher, specialtyIds } = req.body;
    const { ID_Company } = req.user;

    // Ensure the teacher exists
    const teacher = await Teacher.findOne({ where: { ID_Teacher, ID_Company } }, { transaction });
    if (!teacher) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    // Validate specialtyIds
    const validSpecialties = await Specialty.count({ where: { ID_Specialties: specialtyIds, ID_Company }, transaction });
    if (validSpecialties !== specialtyIds.length) {
      throw new Error('One or more specialties do not exist.');
    }

    // Simplified association update
    await teacher.setSpecialties(specialtyIds, { transaction });

    await transaction.commit();
    res.json({ message: 'Teacher specialties updated successfully.' });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ error: error.message });
  }
};



module.exports = teacherController;
