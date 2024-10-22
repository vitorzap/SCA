const { Professional, User, Specialty, RegularSchedule, Appointment, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const yup = require('yup');
const { generateSalt, generateUserName, generatePassword, getUserTypeName, initializeUserTypeIdAndLevel } = require('../utils/userHelpers');

dotenv.config();

// Get the user type name from the filename and initialize the user type ID
const userTypeName = getUserTypeName(__filename);
const {userTypeID, userTypeLevel} = initializeUserTypeIdAndLevel(userTypeName);

const professionalSchema = yup.object().shape({
  Name: yup.string().required()
           .min(2, 'Name must be at least 2 characters long')
           .max(100, 'Name must not exceed 100 characters'),
  Email: yup.string().email('Enter a valid email').required('Email is required')
});

const updateProfessionalSchema = yup.object().shape({
  Name: yup.string()
           .min(2, 'Name must be at least 2 characters long')
           .max(100, 'Name must not exceed 100 characters'),
  Email: yup.string().email('Enter a valid email')
});

const professionalController = {
  create: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { Name, Email, specialtyIds } = req.body;
      const { ID_Company } = req.user; 

      await professionalSchema.validate({ Name, Email });

      // Verifica se userTypeID e userTypeLevel são válidos
      if (userTypeID === -1 || userTypeLevel === -1) {
        return res.status(400).json({ error: `UserType not found for name: ${userTypeName}` });
      }
      if (userTypeLevel < 2) {
        return res.status(400).json({ error: `UserTypeLevel =  ${userTypeLevel} not permitedfound for: ${userTypeName}`  });
      }

      if (!specialtyIds || specialtyIds.length === 0) {
        throw new Error('A professional must have at least one specialty.');
      }     

      // Verificando se as especialidades existem para empresa (Company)
      const specialties = await Specialty.findAll({ 
        where: { 
          ID_Specialties: specialtyIds,
          ID_Company 
        } 
      }, { transaction });

      if (specialties.length !== specialtyIds.length) {
        throw new Error('One or more specialties do not exist for the given company.');
      }     

      // Gera password inicial do usuário
      const passwordLength = parseInt(process.env.AUTO_GENERATED_PASSWORD_LENGTH) || 10; 
      const password = generatePassword(passwordLength);
      const customSalt = await generateSalt();
      const hashedPassword = await bcrypt.hash(password, customSalt);

      // Gera o nome do usuário baseado no nome do profissional
      let userName = await generateUserName(Name); // Tentativa inicial
      let userNameExists = await User.findOne({ where: { UserName: userName } }, { transaction });

      let counter = 1;
      while (userNameExists) {
        userName = await generateUserName(Name, counter);
        userNameExists = await User.findOne({ where: { UserName: userName } }, { transaction });
        counter++;
      }

      // Insere usuário
      const newUser = await User.create({
        UserName: userName,
        UserEmail: Email, 
        UserPassword: hashedPassword,
        UserType: userTypeId,  // Use the ID initialized for UserType
        ID_Company
      }, { transaction });

      // Insere profissional
      const newProfessional = await Professional.create({
        ID_User: newUser.ID_User,
        Name,
        ID_Company
      }, { transaction });

      await newProfessional.addSpecialties(specialties, { transaction });

      await transaction.commit();

      res.status(201).json(newProfessional);
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  },
  
  getAll: async (req, res) => {
    try {
      const { ID_Company } = req.user;
      const professionals = await Professional.findAll({
        where: { ID_Company }
      });
      res.json(professionals);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
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

      const professional = await Professional.findOne({
        where: { ID_Professional: id, ID_Company },
        include: includeOptions
      });

      if (!professional) {
        return res.status(404).json({ message: 'Professional not found or does not belong to this company.' });
      }

      // Preparar resposta incluindo as especialidades, se aplicável
      const response = professional.toJSON(); // Converter o modelo Sequelize para um objeto simples

      res.json(response);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getByName: async (req, res) => {
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

      const professionals = await Professional.findAll({ where: whereCondition });
      if (professionals.length > 0) {
        res.json(professionals);
      } else {
        res.status(404).json({ error: 'No professionals found matching criteria.' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getBySpecialty: async (req, res) => {
    try {
      const { specialtyId } = req.params;
      const { ID_Company } = req.user;

      const professionals = await Professional.findAll({
        include: [{
          model: Specialty,
          where: { ID_Specialties: specialtyId },
          through: {
            attributes: []
          }
        }],
        where: { ID_Company }
      });

      if (professionals.length > 0) {
        res.json(professionals);
      } else {
        res.status(404).json({ error: 'No professionals found for the given specialty.' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { Name, Email } = req.body;
      const { ID_Company } = req.user;

      await updateProfessionalSchema.validate({ Name, Email }, {
        abortEarly: false,
        stripUnknown: true
      });

      // Buscar o profissional existente  
      const professional = await Professional.findOne({
        where: { ID_Professional: id, ID_Company },
        transaction
      });

      if (!professional) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Professional not found.' });
      }

      // Se forneceu Name, aplicar as atualizações ao profissional
      if (Name) {
        await Professional.update({ Name }, {
          where: { ID_Professional: id, ID_Company },
          transaction
        });
      }

      // Se o email foi fornecido, atualize também o usuário associado
      if (Email) {
        await User.update({ UserEmail: Email }, {
          where: { ID_User: professional.ID_User },
          transaction
        });
      }

      await transaction.commit();

      // Recuperar o profissional atualizado para retorno
      const updatedProfessional = await Professional.findOne({
        where: { ID_Professional: id, ID_Company },
        include: [{ 
          model: User, as: 'userInfo',
          attributes: ['ID_User', 'UserName', 'UserEmail', 'UserType']
         }]
      });

      res.json(updatedProfessional);

    } catch (error) {
      await transaction.rollback();
      if (error instanceof yup.ValidationError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;
      const professional = await Professional.findOne({
        where: { ID_Professional: id, ID_Company },
        include: [{
            model: Specialty,
            as: 'Specialties',
            through: {
                attributes: []
            }
        }],
        transaction
      });
      if (!professional) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Professional not found.' });
      }

      // Verificar se o profissional está associado a algum RegularSchedule
      const hasRegularSchedules = await RegularSchedule.findOne({
        where: { ID_Professional: professional.ID_Professional },
        transaction
      });

      if (hasRegularSchedules) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cannot delete professional because they are associated with RegularSchedules.' });
      }  

      // Verificar se o profissional está associado a algum Appointment
      const hasAppointments = await Appointment.findOne({
        where: { ID_Professional: professional.ID_Professional },
        transaction
      });

      if (hasAppointments) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cannot delete professional because they are associated with Appointment.' });
      }  
      // Excluir as associações do profissional com especialidades
      await professional.removeSpecialties(professional.Specialties, { transaction });

      // Excluir o profissional
      await professional.destroy(
        {where: { ID_Professional: professional.ID_Professional }, 
        transaction 
      });    

      // Excluir o usuário associado ao profissional
      await User.destroy({ 
        where: { ID_User: professional.ID_User },  
        transaction 
      });

      await transaction.commit();
      res.json({ message: 'Professional and corresponding user deleted successfully.' });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  },

  updateSpecialties: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { specialtyIds } = req.body;
      const { ID_Company } = req.user;

      // Ensure the professional exists
      const professional = await Professional.findOne({ where: { ID_Professional: id, ID_Company } }, { transaction });
      if (!professional) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Professional not found.' });
      }

      // Validate specialtyIds
      const validSpecialties = await Specialty.count({ where: { ID_Specialties: specialtyIds, ID_Company }, transaction });
      if (validSpecialties !== specialtyIds.length) {
        throw new Error('One or more specialties do not exist.');
      }

      // Simplified association update
      await professional.setSpecialties(specialtyIds, { transaction });

      await transaction.commit();
      res.json({ message: 'Professional specialties updated successfully.' });
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = professionalController;