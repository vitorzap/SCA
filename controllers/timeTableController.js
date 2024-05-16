const { TimeTable, Teacher, TeacherSpecialties, Specialty, sequelize }  = require('../models');
const { Op } = require('sequelize');
const { eachDayOfInterval, parseISO, setHours, setMinutes, getDay } = require('date-fns');

const timeTableController = {
  createTimeTable: async (req, res) => {
    try {
      const { ID_Teacher, Day_of_Week, Start_Time, End_Time, Capacity, ID_Specialty } = req.body;
      const { ID_Company } = req.user;

      if (Capacity <= 0) {
        return res.status(400).json({ message: 'Capacity must be greater than zero.' });
      }


      if (Day_of_Week < 0 || Day_of_Week > 6) {
        return res.status(400).json({ message: 'Day_of_Week must be between 0 (Sunday) and 6 (Saturday).' });
      }

      // Verifique se o professor pertence à mesma companhia
      const teacher = await Teacher.findOne({ where: { ID_Teacher, ID_Company } });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found.' });
      }

      // Verifica se o professor possui a especialidade requerida
      const specialty = await Specialty.findOne({
        include: [{
          model: Teacher,
          as: 'Teachers',
          where: { ID_Teacher: teacher.ID_Teacher },
          through: { model: TeacherSpecialties },
          required: true
        }],
        where: { ID_Specialties: ID_Specialty }
      });

      if (!specialty) {
        return res.status(400).json({ message: 'Teacher does not have the required specialty.' });
      }  
      
      // Verificar sobreposição de horário para o mesmo ID_Teacher
      const overlappingTimeTable = await TimeTable.findOne({
        where: {
          ID_Teacher,
          Day_of_Week,
          [Op.or]: [
            {
              Start_Time: { [Op.lt]: End_Time },
              End_Time: { [Op.gt]: Start_Time },
            }
          ],
          ID_Company
        }
      });

      if (overlappingTimeTable) {
        return res.status(400).json({ message: 'The timetable overlaps with an existing timetable for the teacher.' });
      }

      const newTimeTable = await TimeTable.create({
        ID_Teacher,
        Day_of_Week,
        Start_Time,
        End_Time,
        Capacity,
        Available_Capacity: Capacity,
        ID_Company,
        ID_Specialty
      });

      res.status(201).json(newTimeTable);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  addClient: async (req, res) => {
    try {
      const { ID_TimeTable, ClientID } = req.body;
      const { ID_Company } = req.user;
  
      const timeTable = await TimeTable.findOne({ where: { ID_TimeTable, ID_Company } });
      if (!timeTable) {
        return res.status(404).json({ message: 'TimeTable not found.' });
      }
  
      if (timeTable.Available_Capacity <= 0) {
        return res.status(400).json({ message: 'TimeTable capacity is exhausted.' });
      }
  
      // Verifica se o cliente pertence à mesma companhia e existe
      const clientExists = await Client.findOne({ where: { ClientID, ID_Company } });
      if (!clientExists) {
        return res.status(404).json({ message: 'Client not found.' });
      }

         // Verificar se o client já está associado ao timeTable
    const existingAssociation = await sequelize.models.TimeTableClients.findOne({
      where: { ID_TimeTable, ClientID }
    });

    if (existingAssociation) {
      return res.status(409).json({ message: 'This client is already associated with the TimeTable.' });
    }
  
      // Associar o Client ao TimeTable
      // Supondo que existe uma tabela de associação TimeTableClients
      await sequelize.models.TimeTableClients.create({
        ID_TimeTable,
        ClientID
      });
  
      // Decrementa Available_Capacity
      await TimeTable.update(
        { Available_Capacity: sequelize.literal('Available_Capacity - 1') },
        { where: { ID_TimeTable } }
      );
  
      res.status(200).json({ message: 'Client added to TimeTable successfully.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },  

  removeClient: async (req, res) => {
    try {
      const { ID_TimeTable, ClientID } = req.body;
      const { ID_Company } = req.user;
  
      // Encontre o TimeTable correspondente e assegure que pertença à companhia correta
      const timeTable = await TimeTable.findOne({
        where: { ID_TimeTable, ID_Company }
      });
  
      if (!timeTable) {
        return res.status(404).json({ message: 'TimeTable not found.' });
      }
  
      // Verifica se a capacidade disponível já está no máximo
      if (timeTable.Available_Capacity === timeTable.Capacity) {
        return res.status(400).json({ message: 'Cannot remove client as the TimeTable is at full capacity.' });
      }
  
      // Encontre a associação na tabela TimeTableClients para deletar
      const association = await sequelize.models.TimeTableClients.findOne({
        where: { ID_TimeTable, ClientID }
      });
  
      if (!association) {
        return res.status(404).json({ message: 'Client is not associated with this TimeTable.' });
      }
  
      // Remova a associação
      await association.destroy();
  
      // Incremente Available_Capacity, garantindo que não exceda Capacity
      const updatedCapacity = Math.min(timeTable.Capacity, timeTable.Available_Capacity + 1);
      await TimeTable.update(
        { Available_Capacity: updatedCapacity },
        { where: { ID_TimeTable } }
      );
  
      res.status(200).json({ message: 'Client removed from TimeTable successfully and capacity updated.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateTimeTable: async (req, res) => {
    const { id } = req.params;
    const { Day_of_Week, Start_Time, End_Time, Capacity, Available_Capacity, ID_Specialty, ID_Teacher } = req.body;
    const { ID_Company } = req.user;

    try {

        // Validar sobreposição de horário
        const overlappingTimeTable = await TimeTable.findOne({
          where: {
            ID_TimeTable: { [Op.ne]: id },
            ID_Teacher,
            Day_of_Week,
            Start_Time: { [Op.lt]: End_Time },
            End_Time: { [Op.gt]: Start_Time },
            ID_Company,
          }
        });

        if (overlappingTimeTable) {
          return res.status(400).json({ message: 'The update results in an overlapping timetable for the teacher.' });
        }

        // Validar se o Teacher tem a Specialty
        const teacherHasSpecialty = await TeacherSpecialties.findOne({
          where: { ID_Teacher, ID_Specialties: ID_Specialty }
        });
        if (!teacherHasSpecialty) {
          return res.status(400).json({ message: 'The teacher does not have the specified specialty.' });
        }

        // Verificar Capacity e Available_Capacity
        if (Available_Capacity > Capacity) {
          return res.status(400).json({ message: 'Available capacity cannot exceed total capacity.' });
        }


        // Obter a contagem de clientes associados ao TimeTable
        const clientCount = await sequelize.models.TimeTableClients.count({
          where: { ID_TimeTable: id }
        });

        if ((Capacity - Available_Capacity) !== clientCount) {
          return res.status(400).json({ message: 'The new timetable occupancy count do not match the number of associated clients.' });
        }

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

      // Primeiro, busca pelo TimeTable para verificar se ele existe e pertence à ID_Company do usuário
      const timeTable = await TimeTable.findOne({
        where: { ID_TimeTable: id, ID_Company }
      });

      // Se o TimeTable não for encontrado, retorna um erro
      if (!timeTable) {
        return res.status(404).json({ message: 'TimeTable record not found.' });
      }

      // Supondo uma relação muitos-para-muitos com uma tabela de associação chamada TimeTableClients
      const clientAssociations = await sequelize.models.TimeTableClients.count({
        where: { ID_TimeTable: id }
      });
      if (clientAssociations > 0) {
        return res.status(400).json({ message: 'Cannot delete TimeTable with associated clients.' });
      }

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
    const { startDate, endDate, startTime, endTime, daysOfWeek, ID_Teacher, Capacity, ID_Specialty } = req.body;
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

      // Verifica se o professor possui a especialidade requerida
      const specialtyExists = await TeacherSpecialties.findOne({
        where: {
          ID_Teacher,
          ID_Specialty
        }
      });

      if (!specialtyExists) {
        return res.status(400).json({ message: 'Teacher does not have the required specialty.' });
      }
  
      let operations = [];
      let overlappingRecords = [];

      await Promise.all(eachDayOfInterval({ start: parsedStartDate, end: parsedEndDate }).map(async date => {
        const dayOfWeek = getDay(date);
        if (daysOfWeek.includes(dayOfWeek)) {
          const startDateWithTime = setHours(setMinutes(date, startMinute), startHour);
          const endDateWithTime = setHours(setMinutes(date, endMinute), endHour);

          // Verificar sobreposição de horário para o mesmo ID_Teacher
          const overlappingTimeTable = await TimeTable.findOne({
            where: {
              ID_Teacher,
              Day_of_Week: dayOfWeek,
              Start_Time: { [Op.lt]: endDateWithTime },
              End_Time: { [Op.gt]: startDateWithTime },
              ID_Company
            }
          });

          if (overlappingTimeTable) {
            overlappingRecords.push(overlappingTimeTable);
          } else {
            operations.push({
              ID_Teacher,
              Day_of_Week: date,
              Start_Time: startDateWithTime,
              End_Time: endDateWithTime,
              Capacity,
              Available_Capacity: Capacity,
              ID_Company,
              ID_Specialty
            });
          }
        }
      })); 

      // Se existirem registros com sobreposição, interrompe a execução e retorna um erro
      if (overlappingRecords.length > 0) {
        return res.status(400).json({
          message: 'Overlapping time table records detected.',
          overlappingRecords
        });
      }

      // Procede com a criação de registros de TimeTable se não houver sobreposições
      // Utilizando uma transação para garantir a atomicidade da operação
      await sequelize.transaction(async (t) => {
        for (const operation of operations) {
          await TimeTable.create(operation, { transaction: t });
        }
      });
  
      res.status(201).json({ message: 'TimeTable records created successfully.' });
    } catch (error) {
      res.status(400).json({ error: error.message }); //dddd
    }
  },
  
  deleteInInterval: async (req, res) => {
    const { startDate, endDate, startTime, endTime, daysOfWeek, ID_Teacher, ID_Specialty, force } = req.body;
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

        if (ID_Specialty) {
          whereConditions.ID_Specialty = ID_Specialty;
        }
  
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

  deleteClient: async (req, res) => {
    const { ClientID, startDate, endDate, daysOfWeek, ID_Specialty } = req.body;
    const { ID_Company } = req.user;
  
    try {
      const parsedStartDate = parseISO(startDate);
      const parsedEndDate = parseISO(endDate);
  
      // Assegurar que as datas estão em formato válido e o intervalo é lógico
      if (!parsedStartDate || !parsedEndDate || parsedEndDate < parsedStartDate) {
        return res.status(400).json({ message: 'Invalid date range provided.' });
      }
  
      // Buscar por todas as associações TimeTableClients que correspondem aos critérios
      const associations = await sequelize.models.TimeTableClients.findAll({
        include: [{
          model: TimeTable,
          required: true,
          where: {
            ID_Company,
            ...(ID_Specialty && { ID_Specialty }),
            Day_of_Week: daysOfWeek ? { [Op.in]: daysOfWeek } : undefined,
            Date: { [Op.between]: [startDate, endDate] }
          }
        }],
        where: { ClientID }
      });
  
      // Nenhuma associação encontrada
      if (associations.length === 0) {
        return res.status(404).json({ message: 'No associations found for given criteria.' });
      }
  
      await sequelize.transaction(async (t) => {
        for (const association of associations) {
          // Remover a associação
          await association.destroy({ transaction: t });
  
          // Incrementar Available_Capacity em um para o TimeTable relacionado
          await TimeTable.increment('Available_Capacity', { by: 1, where: { ID_TimeTable: association.ID_TimeTable }, transaction: t });
        }
      });
  
      res.status(200).json({ message: `Client associations removed successfully. Total: ${associations.length}` });
    } catch (error) {
      console.error('Failed to delete client associations:', error);
      res.status(400).json({ error: error.message });
    }
  },
  
  listTimeTables: async (req, res) => {
    const { startDate, endDate, ID_Teacher, Available_Capacity, daysOfWeek, listTeacher, listSpecialty, listClient } = req.query;
    const { ID_Company } = req.user;
  
    // Validação dos intervalos de data e daysOfWeek permanecem inalteradas...
  
    try {
      const conditions = { ID_Company }; // Restringe a listagem aos registros da companhia do usuário
      const include = [];
  
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
  
      // Incluir Teacher se listTeacher for verdadeiro
      if (listTeacher === 'true') {
        include.push({
          model: Teacher,
          as: 'Teacher' // Ajuste 'as' conforme sua associação
        });
      }
  
      // Incluir Specialty se listSpecialty for verdadeiro
      if (listSpecialty === 'true') {
        include.push({
          model: Specialty,
          as: 'Specialty' // Ajuste 'as' conforme sua associação
        });
      }
  
      // Preparando para filtrar por ClientID
      if (ClientID) {
        include.push({
          model: Client,
          as: 'Clients', // Ajuste 'as' conforme sua associação
          where: { ClientID: ClientID },
          through: { attributes: [] } // Esconde os atributos da tabela de junção, se necessário
        });
      } else if (listClient === 'true') { // Se listClient for verdadeiro, mas sem ClientID específico
        include.push({
          model: Client,
          as: 'Clients',
          through: { attributes: [] }
        });
      }
  
      const timeTables = await TimeTable.findAll({
        where: conditions,
        include: include
      });
  
      res.json(timeTables);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
};

module.exports = timeTableController;
