const { Op } = require('sequelize');
const { RegularSchedule, Appointment } = require('../models');

/**
 * Verifica a sobreposição de horários para um professor em um determinado dia.
 *
 * @param {number} ID_Teacher - O ID do professor.
 * @param {number} Day_of_Week - O dia da semana (0-6).
 * @param {string} Start_Time - O horário de início.
 * @param {string} End_Time - O horário de término.
 * @param {number} ID_Company - O ID da companhia.
 * @param {string} Start_Date - A data de início do período.
 * @param {string} End_Date - A data de término do período.
 * @param {number} [excludeID] - Um ID de RegularSchedule para excluir da verificação (opcional).
 * @returns {Promise<Array>} - Uma lista de RegularSchedules em sobreposição.
 */
const checkOverlappingSchedules = async (ID_Teacher, Day_of_Week, Start_Time, End_Time, ID_Company, Start_Date, End_Date, excludeID = null) => {
  const whereConditions = {
    ID_Teacher,
    Day_of_Week,
    Start_Time: { [Op.lt]: End_Time },
    End_Time: { [Op.gt]: Start_Time },
    ID_Company,
    [Op.or]: [
      {
        End_Date: { [Op.is]: null },
        Start_Date: { [Op.lte]: End_Date || new Date('9999-12-31') }
      },
      {
        End_Date: { [Op.gte]: Start_Date }
      }
    ]
  };

  if (excludeID) {
    whereConditions.ID_RegularSchedule = { [Op.ne]: excludeID };
  }

  return await RegularSchedule.findAll({ where: whereConditions });
};

/**
 * Verifica a sobreposição de Appointments que não têm ID_RegularSchedule.
 *
 * @param {number} ID_Teacher - O ID do professor.
 * @param {number} Day_of_Week - O dia da semana (0-6).
 * @param {string} Start_Time - O horário de início.
 * @param {string} End_Time - O horário de término.
 * @param {string} Start_Date - A data de início do período.
 * @param {string} End_Date - A data de término do período.
 * @param {number} ID_Company - O ID da companhia.
 * @param {string|object} Status - O status dos Appointments (string ou objeto Op).
 * @returns {Promise<Array>} - Uma lista de Appointments em sobreposição.
 */
const checkOverlappingAppointments = async (ID_Teacher, Day_of_Week, Start_Time, End_Time, Start_Date, End_Date, ID_Company, Status) => {
  return await Appointment.findAll({
    where: {
      ID_Teacher,
      ID_RegularSchedule: null,
      Day_of_Week,
      Start_Time: { [Op.lt]: End_Time },
      End_Time: { [Op.gt]: Start_Time },
      Date: { [Op.between]: [Start_Date, End_Date || new Date('9999-12-31')] },
      ID_Company,
      Status
    }
  });
};

module.exports = {
  checkOverlappingSchedules,
  checkOverlappingAppointments
};
