const { Teacher, User, Specialty, TimeTable, sequelize } = require('../models');
const { Op } = require('sequelize');
const { generateSalt, generateUserName, generatePassword } = require('../utils/userHelpers');
const bcrypt = require('bcrypt');
require('dotenv').config();
const yup = require('yup');


const teacherSchema = yup.object().shape({
  Name: yup.string().required()
                    .min(2, 'Name must be at least 2 characters long')
                    .max(100, 'Name must not exceed 100 characters'),
  Email: yup.string().email('Enter a valid email').required('Email is required')
});

const updateTeacherSchema = yup.object().shape({
  Name: yup.string()
           .min(2, 'Name must be at least 2 characters long')
           .max(100, 'Name must not exceed 100 characters'),
  Email: yup.string().email('Enter a valid email')
});


const teacherController = {
  createTeacher: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { Name, Email, specialtyIds } = req.body;
      const { ID_Company } = req.user; 

      await teacherSchema.validate({ Name, Email });

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
      const passwordLength = parseInt(process.env.AUTO_GENERATED_PASSWORD_LENGTH) || 10; 
      const password = generatePassword(passwordLength);
      const customSalt = await generateSalt();
      const hashedPassword = await bcrypt.hash(password, customSalt);
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

      await newTeacher.addSpecialties(specialties, { transaction });

      await transaction.commit();

      res.status(201).json(newTeacher);
    } catch (error) {
      await transaction.rollback();
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

  getTeachersByName: async (req, res) => {
    try {
        let { name } = req.params;
        const { ID_Company, UserType } = req.user;
        let whereCondition = { ID_Company };

        if (UserType !== 'Root') {
            whereCondition.ID_Company = ID_Company;
        }

        if (name.includes('*')) {
            name = name.replace(/\*/g, '%'); // Substitui * por % para uso no LIKE do SQL
            whereCondition.Name = { [Op.like]: name };
        } else {
            whereCondition.Name = name;
        }

        const teachers = await Teacher.findAll({ where: whereCondition });
        if (teachers.length > 0) {
            res.json(teachers);
        } else {
            res.status(404).json({ error: 'No teachers found matching criteria.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  },

  getTeachersBySpecialty: async (req, res) => {
    try {
        const { specialtyId } = req.params;
        const { ID_Company } = req.user; // Remove UserType, já que não é mais necessário

        const teachers = await Teacher.findAll({
            include: [{
                model: Specialty,
                where: { ID_Specialties: specialtyId },
                through: {
                    attributes: []
                }
            }],
            where: { ID_Company } // Sempre restringir a busca pela empresa do usuário logado
        });

        if (teachers.length > 0) {
            res.json(teachers);
        } else {
            res.status(404).json({ error: 'No teachers found for the given specialty.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  },


  updateTeacher: async (req, res) => {

    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { Name, Email } = req.body;
      const { ID_Company } = req.user;

      await updateTeacherSchema.validate({ Name, Email }, {
        abortEarly: false,  // Coletar todos os erros, não apenas o primeiro
        stripUnknown: true  // Remover chaves não definidas no schema
      });

      // Buscar o professor existente  
      const teacher = await Teacher.findOne({
        where: { ID_Teacher: id, ID_Company },
        transaction
      });

      if (!teacher) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Teacher not found.' });
      }
 
      // Se forneceu Name, aplicar as atualizações ao professor
      if (Name) {
        await Teacher.update({ Name }, {
          where: { ID_Teacher: id, ID_Company },
          transaction
        });
      }
      // Se o email foi fornecido, atualize também o usuário associado
      if (Email) {
        await User.update({ UserEmail: Email }, {
          where: { UserID: teacher.UserID },
          transaction
        });
      }

      await transaction.commit();

      // Recuperar o professor atualizado para retorno
      const updatedTeacher = await Teacher.findOne({
        where: { ID_Teacher: id, ID_Company },
        include: [{ 
          model: User, as: 'userInfo',
          attributes: ['UserID', 'UserName', 'UserEmail', 'UserType']
         }]

      });

      res.json(updatedTeacher);

    } catch (error) {
      await transaction.rollback();
      if (error instanceof yup.ValidationError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  },

  
  deleteTeacher: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;
      const teacher = await Teacher.findOne({
        where: { ID_Teacher: id, ID_Company },
        include: [{
            model: Specialty,
            as: 'Specialties',  // This alias 'Specialties' should match how you defined the association
            through: {
                attributes: []
            }
        }],
        transaction
      });
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

      // Excluir o professor
      await teacher.destroy(
        {where: { ID_Teacher: teacher.ID_Teacher }, 
        transaction 
      });    

      // Excluir o usuário associado ao professor
      await User.destroy({ 
        where: { UserID: teacher.UserID },  
        transaction 
      });

      await transaction.commit();
      res.json({ message: 'Teacher and corresponding user deleted successfully.' });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  },

  updateSpecialty: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { specialtyIds } = req.body;
      const { ID_Company } = req.user;

      // Ensure the teacher exists
      const teacher = await Teacher.findOne({ where: { ID_Teacher: id, ID_Company } }, { transaction });
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
  }
};


module.exports = teacherController;
