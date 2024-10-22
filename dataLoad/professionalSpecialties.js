const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.json')['development'];
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Importação dos modelos
const defineProfessional = require('../models/professional');
const defineSpecialty = require('../models/Specialty');
const defineProfessionalSpecialties = require('../models/professionalSpecialty');
const defineCompany = require('../models/Company');

const Professional = defineProfessional(sequelize, DataTypes);
const Specialty = defineSpecialty(sequelize, DataTypes);
const ProfessionalSpecialties = defineProfessionalSpecialties(sequelize, DataTypes);
const Company = defineCompany(sequelize, DataTypes);

// Função para criar associações para cada empresa
async function createAssociations() {
  try {
    console.log('Iniciando');

    // Busca todas as empresas
    const companies = await Company.findAll();

    for (let company of companies) {
      const companyId = company.ID_Company;

      // Busca todos os professores e especialidades dessa empresa
      const professionals = await Professional.findAll({
        where: { ID_Company: companyId }
      });

      const specialties = await Specialty.findAll({
        where: { ID_Company: companyId }
      });

      for (let professional of professionals) {
        // Determinar quantas especialidades associar ao professor
        const numSpecialties = Math.floor(Math.random() * specialties.length) + 1;
        const selectedSpecialties = shuffle(specialties).slice(0, numSpecialties);

        // Associar especialidades ao professor
        for (let specialty of selectedSpecialties) {
          await ProfessionalSpecialties.create({
            ID_Professional: professional.ID_Professional,
            ID_Specialties: specialty.ID_Specialties
          });
        }
      }
    }

    console.log('Associations created successfully for all companies');
  } catch (error) {
    console.error('Failed to create associations:', error);
  }
}

// Função para embaralhar um array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Executar a função
createAssociations();
