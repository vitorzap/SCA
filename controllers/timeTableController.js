const { TimeTable, sequelize, Teacher } = require('../models');
const { Op } = require('sequelize');
const { eachDayOfInterval, parseISO, setHours, setMinutes, getDay } = require('date-fns');

const timeTableController = {
  createTimeTable: async (req, res) => {
    try {
      const { ID_Teacher, Day_of_Week, Start_Time, End_Time, Capacity } = req.body;
      const { ID_Company } = req.user; // ID_Company vem de req.user

      if (Capacity <= 0) {
        return res.status(400).json({ message: 'Capacity must be greater than zero.' });
      }

      // Verifique se o professor pertence à mesma companhia
      const teacher = await Teacher.findOne({ where: { ID_Teacher, ID_Company } });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found.' });
      }

      const newTimeTable = await TimeTable.create({
        ID_Teacher,
        Day_of_Week,
        Start_Time,
        End_Time,
        Capacity,
        Available_Capacity: Capacity, // Assuming the initial available capacity is set to the total capacity
        ID_Company // Inclua o ID_Company no registro
      });

      res.status(201).json(newTimeTable);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateTimeTable: async (req, res) => {
    const { id } = req.params;
    const { Day_of_Week, Start_Time, End_Time, Capacity, Available_Capacity } = req.body;
    const { ID_Company } = req.user;

    try {
        const updated = await TimeTable.update(
            { Day_of_Week, Start_Time, End_Time, Capacity, Available_Capacity },
            { where: { ID_TimeTable: id, ID_Company } } // Restringe a atualização aos registros da companhia do usuário
        );

        if (updated[0] > 0) {
            res.status(200).json({ message: 'TimeTable record updated successfully.' });
        } else {
            res.status(404).json({ message: 'TimeTable record not found or does not belong to your company.' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
},

  deleteTimeTable: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user; // ID_Company vem de req.user

      const deleted = await TimeTable.destroy({
        where: { ID_TimeTable: id, ID_Company } // Apenas permite a exclusão se pertencer à companhia do usuário
      });

      if (deleted) {
        res.status(200).json({ message: 'TimeTable record deleted successfully.' });
      } else {
        res.status(404).json({ message: 'TimeTable record not found.' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  createInInterval: async (req, res) => {
    const { startDate, endDate, startTime, endTime, daysOfWeek, ID_Teacher, Capacity } = req.body;
    const { ID_Company } = req.user;
  
    // Verificações iniciais para capacidade e dias da semana
    if (Capacity <= 0) {
      return res.status(400).json({ message: 'Capacity must be greater than zero.' });
    }
  
    if (!daysOfWeek || daysOfWeek.length === 0) {
      return res.status(400).json({ message: 'Days of week must not be empty.' });
    }
  
    const parsedStartDate = parseISO(startDate);
    const parsedEndDate = parseISO(endDate);
  
    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }
  
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
  
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }
  
    try {
      const teacher = await Teacher.findOne({ where: { ID_Teacher, ID_Company } });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found.' });
      }
  
      let operations = [];
      eachDayOfInterval({ start: parsedStartDate, end: parsedEndDate }).forEach(date => {
        const dayOfWeek = getDay(date);
        if (daysOfWeek.includes(dayOfWeek)) {
          const startDateWithTime = setHours(setMinutes(date, startMinute), startHour);
          const endDateWithTime = setHours(setMinutes(date, endMinute), endHour);
          operations.push({
            ID_Teacher,
            Day_of_Week: date,
            Start_Time: startDateWithTime,
            End_Time: endDateWithTime,
            Capacity,
            Available_Capacity: Capacity,
            ID_Company
          });
        }
      });
  
      // Utilizando uma transação para garantir a atomicidade da operação
      await sequelize.transaction(async (t) => {
        for (const operation of operations) {
          await TimeTable.create(operation, { transaction: t });
        }
      });
  
      res.status(201).json({ message: 'TimeTable records created successfully.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  deleteInInterval: async (req, res) => {
    const { startDate, endDate, startTime, endTime, daysOfWeek, ID_Teacher, force } = req.body;
    const { ID_Company } = req.user;
  
    if (!daysOfWeek || daysOfWeek.length === 0) {
      return res.status(400).json({ message: 'Days of week must not be empty.' });
    }
  
    const parsedStartDate = parseISO(startDate);
    const parsedEndDate = parseISO(endDate);
  
    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }
  
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
  
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }
  
    try {
      await sequelize.transaction(async (t) => {
        const datesToDelete = eachDayOfInterval({ start: parsedStartDate, end: parsedEndDate })
          .filter(date => daysOfWeek.includes(getDay(date)))
          .map(date => format(date, 'yyyy-MM-dd'));
  
        for (const date of datesToDelete) {
          let whereConditions = {
            ID_Company,
            ID_Teacher,
            Day_of_Week: date,
            Start_Time: {
              [Op.gte]: `${date} ${startTime}:00`
            },
            End_Time: {
              [Op.lte]: `${date} ${endTime}:00`
            }
          };
  
          if (!force) {
            whereConditions = {
              ...whereConditions,
              Available_Capacity: { [Op.lt]: sequelize.col('Capacity') }
            };
          }
  
          const deletedCount = await TimeTable.destroy({
            where: whereConditions,
            transaction: t
          });
  
          if (!force && deletedCount === 0) {
            throw new Error('Deletion not allowed without force for records with full capacity.');
          }
        }
      });
  
      res.status(200).json({ message: 'Time tables deleted based on criteria.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  

  listTimeTables: async (req, res) => {
    const { startDate, endDate, ID_Teacher, Available_Capacity, daysOfWeek } = req.query;
    const { ID_Company } = req.user;
  
    // Validação dos intervalos de data
    if (startDate && endDate) {
      const parsedStartDate = parseISO(startDate);
      const parsedEndDate = parseISO(endDate);
      if (parsedEndDate < parsedStartDate) {
        return res.status(400).json({ message: 'End date must be after start date.' });
      }
    }
  
    // Validação para daysOfWeek
    if (daysOfWeek) {
      const daysOfWeekArray = daysOfWeek.split(',').map(Number);
      if (daysOfWeekArray.length === 0 || daysOfWeekArray.some(day => isNaN(day) || day < 0 || day > 6)) {
        return res.status(400).json({ message: 'Invalid daysOfWeek provided.' });
      }
    }
  
    try {
        const conditions = { ID_Company }; // Restringe a listagem aos registros da companhia do usuário
        if (ID_Teacher) conditions.ID_Teacher = ID_Teacher;
        if (Available_Capacity) conditions.Available_Capacity = { [Op.gte]: Available_Capacity };
  
        // Adiciona condições para filtrar por dias da semana, se fornecido
        if (daysOfWeek) {
          const daysOfWeekArray = daysOfWeek.split(',').map(Number);
          conditions.Day_of_Week = { [Op.in]: daysOfWeekArray };
        }
  
        // Adiciona condições para filtrar por intervalo de datas, se fornecido
        if (startDate && endDate) {
          conditions.Date = {
            [Op.gte]: startDate,
            [Op.lte]: endDate
          };
        }
  
        const timeTables = await TimeTable.findAll({ where: conditions });
        res.json(timeTables);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
  },
  
  // Ajuste as funções createInInterval, deleteInInterval, updateTimeTable, e listTimeTables de maneira similar,
  // garantindo que as operações sejam restritas aos registros da companhia do usuário autenticado.
};

module.exports = timeTableController;
