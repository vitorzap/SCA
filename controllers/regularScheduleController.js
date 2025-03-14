const { RegularSchedule, Professional, ProfessionalSpecialties, Specialty, Client, ClientRegularSchedules, Appointment, sequelize } = require('../models');
const { Op } = require('sequelize');
const { eachDayOfInterval, parseISO, setHours, setMinutes, getDay, format } = require('date-fns');
const { checkOverlappingSchedules, checkOverlappingAppointments } = require('../utils/schedulle/scheduleHelpers');
const yup = require('yup');

const scheduleSchema = yup.object().shape({
  Day_of_Week: yup.number().required('Day_of_Week is required')
                  .min(0, 'Day_of_Week must be between 0 and 6')
                  .max(6, 'Day_of_Week must be between 0 and 6'),
  Start_Time: yup.string().required('Start_Time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start_Time must be a valid time in HH:MM format'),
  End_Time: yup.string().required('End_Time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End_Time must be a valid time in HH:MM format')
    .test('is-greater', 'End_Time must be later than Start_Time', function (value) {
      const { Start_Time } = this.parent;
      return new Date(`1970-01-01T${value}:00Z`) > new Date(`1970-01-01T${Start_Time}:00Z`);
    }),
  Capacity: yup.number().required('Capacity is required')
               .positive('Capacity must be a number greater than 0'),
  ID_Specialty: yup.number().required('ID_Specialty is required')
                   .integer('ID_Specialty must be a numeric value'),
  ID_Professional: yup.number().required('ID_Professional is required')
                 .integer('ID_Professional must be a numeric value'),
  Start_Date: yup.date().required('Start_Date is required')
                 .typeError('Start_Date must be a valid date'),
  End_Date: yup.date().required('End_Date is required')
                .typeError('End_Date must be a valid date')
                .min(yup.ref('Start_Date'), 'End_Date must be after Start_Date'),
  force: yup.boolean().required('force is required')
            .typeError('force must be true or false')
});

const regularScheduleController = {
  create: async (req, res) => {
    try {
      await scheduleSchema.validate(req.body, { abortEarly: false });

      const { ID_Professional, Day_of_Week, Start_Time, End_Time, Capacity, 
              ID_Specialty, Start_Date, End_Date, OnlyCheck } = req.body;
      const { ID_Company } = req.user;
  
      const professional = await Professional.findOne({ where: { ID_Professional, ID_Company } });
      if (!professional) {
        return res.status(404).json({ message: 'Professional not found.' });
      }

      const specialty = await Specialty.findOne({
        include: [{
          model: Professional,
          as: 'Professionals',
          where: { ID_Professional: professional.ID_Professional },
          through: { model: ProfessionalSpecialties },
          required: true
        }],
        where: { ID_Specialties: ID_Specialty }
      });
  
      if (!specialty) {
        return res.status(400).json({ message: 'Professional does not have the required specialty.' });
      }

      const overlappingSchedules = await checkOverlappingSchedules(
        ID_Professional, Day_of_Week, Start_Time, End_Time, 
        ID_Company, Start_Date, End_Date
      );

      const overlappingAppointments = await checkOverlappingAppointments(
        ID_Professional, Day_of_Week, Start_Time, End_Time, 
        Start_Date, End_Date, ID_Company,  { [Op.ne]: 'canceled' }
      );
  
      if (overlappingSchedules.length > 0 || 
          overlappingAppointments.length > 0) {
        return res.status(400).json({ 
          message: 'The schedule overlaps with existing schedules or appointments for the professional.', 
          overlappingSchedules, 
          overlappingAppointments
        });
      }

      if (OnlyCheck) {
        res.status(201).json({ message: 'No overlappings' });
      } else { 
        const newSchedule = await RegularSchedule.create({
          ID_Professional,
          Day_of_Week,
          Start_Time,
          End_Time,
          Capacity,
          ID_Company,
          ID_Specialty,
          Start_Date,
          End_Date
        });
        res.status(201).json(newSchedule);
      }  
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { Capacity, ID_Professional, Start_Date, End_Date, OnlyCheck } = req.body;
    const { ID_Company } = req.user;
  
    try {
      const existingSchedule = await RegularSchedule.findOne({ where: { ID_RegularSchedule: id, ID_Company } });
      if (!existingSchedule) {
        return res.status(404).json({ message: 'RegularSchedule record not found or does not belong to your company.' });
      }

      const updatedData = { ...existingSchedule.dataValues };
      updatedData.Capacity = Capacity !== undefined ? Capacity : existingSchedule.Capacity;
      updatedData.ID_Professional = ID_Professional !== undefined ? ID_Professional : existingSchedule.ID_Professional;
      updatedData.Start_Date = Start_Date !== undefined ? Start_Date : existingSchedule.Start_Date;
      updatedData.End_Date = End_Date !== undefined ? End_Date : existingSchedule.End_Date;

      await scheduleSchema.validate(updatedData);
  
      const clientCount = await ClientRegularSchedules.count({ where: { ID_RegularSchedule: id } });
      if (clientCount > updatedData.Capacity) {
        return res.status(400).json({ message: 'Capacity cannot be less than the number of associated clients.' });
      }

      const professionalHasSpecialty = await ProfessionalSpecialties.findOne({ 
        where: { ID_Professional: updatedData.ID_Professional, ID_Specialties: updatedData.ID_Specialty }
      });
      if (!professionalHasSpecialty) {
        return res.status(400).json({ message: 'The professional does not have the specified specialty.' });
      }
 
      const overlappingSchedules = await checkOverlappingSchedules(
        ID_Professional, updatedData.Day_of_Week, updatedData.Start_Time, updatedData.End_Time, 
        ID_Company, Start_Date, End_Date, id
      );

      const overlappingAppointments = await checkOverlappingAppointments(
        ID_Professional, updatedData.Day_of_Week, updatedData.Start_Time, updatedData.End_Time, 
        Start_Date, End_Date, ID_Company, { [Op.ne]: 'canceled' }
      );

      if (overlappingSchedules.length > 0 || 
          overlappingAppointments.length > 0) {
        return res.status(400).json({ 
          message: 'The schedule overlaps with existing schedules or appointments for the professional.', 
          overlappingSchedules, 
          overlappingAppointments
        });
      }

      if (OnlyCheck) {
        res.status(201).json({ message: 'No overlappings' });
      } else { 
        const updated = await RegularSchedule.update({
          Capacity: updatedData.Capacity,
          ID_Professional: updatedData.ID_Professional,
          Start_Date: updatedData.Start_Date,
          End_Date: updatedData.End_Date,
        }, {
          where: { ID_RegularSchedule: id, ID_Company }
        });
        
        if (updated[0] > 0) {
          res.status(200).json({ message: 'RegularSchedule record updated successfully.' });
        } else {
          res.status(404).json({ message: 'RegularSchedule record not found or does not belong to your company.' });
        }
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

      const schedule = await RegularSchedule.findOne({
        where: { ID_RegularSchedule: id, ID_Company }
      });

      if (!schedule) {
        return res.status(404).json({ message: 'RegularSchedule record not found.' });
      }

      const clientAssociations = await ClientRegularSchedules.count({
        where: { ID_RegularSchedule: id }
      });
      if (clientAssociations > 0) {
        return res.status(400).json({ message: 'Cannot delete RegularSchedule with associated clients.' });
      }

      const deleted = await RegularSchedule.destroy({
        where: { ID_RegularSchedule: id, ID_Company }
      });

      if (deleted) {
        res.status(200).json({ message: 'RegularSchedule record deleted successfully.' });
      } else {
        res.status(404).json({ message: 'RegularSchedule record not found.' });
      }
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

      const regularSchedule = await RegularSchedule.findOne({
        where: { ID_RegularSchedule: id }
      });

      if (regularSchedule && regularSchedule.ID_Company === ID_Company) {
        res.status(200).json(regularSchedule);
      } else {
        res.status(404).json({ message: 'RegularSchedule not found' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  listByParam: async (req, res) => {
    const { startDate, endDate, ID_Professional, Available_Capacity, 
            daysOfWeek, listProfessional, listSpecialty, listClient } = req.query;
    const { ID_Company } = req.user;

    try {
      const conditions = { ID_Company };
      const include = [];

      if (ID_Professional) {
        const professional = await Professional.findOne({
          where: {
            ID_Professional,
            ID_Company
          }
        });

        if (!professional) {
          return res.status(404).json({ message: 'Professional not found or does not belong to your company.' });
        }

        conditions.ID_Professional = ID_Professional;
      }

      if (Available_Capacity !== undefined) {
        const capacityValue = parseInt(Available_Capacity, 10);
        if (isNaN(capacityValue) || capacityValue < 0) {
          return res.status(400).json({ message: 'Available_Capacity must be a number equal to or greater than 0.' });
        }
        conditions.Capacity = { [Op.gte]: capacityValue + sequelize.col('Current_Clients') };
      }
      
      if (daysOfWeek) {
        const daysOfWeekArray = daysOfWeek.split(',').map(Number);
        const invalidDays = daysOfWeekArray.some(day => isNaN(day) || day < 0 || day > 6);

        if (invalidDays) {
          return res.status(400).json({ message: 'daysOfWeek must be a comma-separated list of integers between 0 and 6.' });
        }

        conditions.Day_of_Week = { [Op.in]: daysOfWeekArray };
      }

      if (startDate || endDate) {
        const parsedStartDate = startDate ? parseISO(startDate) : null;
        const parsedEndDate = endDate ? parseISO(endDate) : null;

        if ((parsedStartDate && isNaN(parsedStartDate)) || (parsedEndDate && isNaN(parsedEndDate))) {
          return res.status(400).json({ message: 'Invalid date format.' });
        }

        if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
          return res.status(400).json({ message: 'endDate must be after or equal to startDate.' });
        }

        if (parsedStartDate) conditions.Start_Date = { [Op.gte]: parsedStartDate };
        if (parsedEndDate) {
          conditions.Start_Date = {
            ...(conditions.Start_Date || {}),
            [Op.lte]: parsedEndDate
          };
        }
      }

      if (listProfessional === 'true') {
        include.push({
          model: Professional,
          as: 'Professional'
        });
      }

      if (listSpecialty === 'true') {
        include.push({
          model: Specialty,
          as: 'Specialty'
        });
      }

      if (listClient === 'true') {
        include.push({
          model: Client,
          as: 'Clients',
          through: { attributes: [] }
        });
      }

      const regularSchedules = await RegularSchedule.findAll({
        where: conditions,
        include: include
      });

      res.json(regularSchedules);
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = regularScheduleController;