const { RegularSchedule, Teacher, TeacherSpecialties, Specialty, Client, ClientRegularSchedules, Appointment, sequelize } = require('../models');
const { Op } = require('sequelize');
const { eachDayOfInterval, parseISO, setHours, setMinutes, getDay, format } = require('date-fns');

const scheduleSchema = yup.object().shape({
  Day_of_Week: yup.number().required('Day_of_Week is required')
                  .min(0, 'Day_of_Week must be between 1 and 7')
                  .max(6, 'Day_of_Week must be between 1 and 7'),
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
  ID_Teacher: yup.number().required('ID_Teacher is required')
                 .integer('ID_Teacher must be a numeric value'),
  Start_Date: yup.date().required('Start_Date is required')
                 .typeError('Start_Date must be a valid date'),
  End_Date: yup.date().required('End_Date is required')
                .typeError('End_Date must be a valid date')
                .min(yup.ref('Start_Date'), 'End_Date must be after Start_Date'),
  force: yup.boolean().required('force is required')
            .typeError('force must be true or false')
});






const regularScheduleController = {
  createRegularSchedule: async (req, res) => {
    try {
      await scheduleSchema.validate(req.body, { abortEarly: false });

      const { ID_Teacher, Day_of_Week, Start_Time, End_Time, Capacity, 
              ID_Specialty, Start_Date, End_Date, force } = req.body;
      const { ID_Company } = req.user;
  
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
      const overlappingSchedules = await RegularSchedule.findAll({
        where: {
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
        }
      });

    // Verificar sobreposição com Appointments que não têm ID_RegularSchedule
    const overlappingAppointments = await Appointment.findAll({
      where: {
        ID_Teacher,
        ID_RegularSchedule: null,
        Day_of_Week,
        Start_Time: { [Op.lt]: End_Time },
        End_Time: { [Op.gt]: Start_Time },
        Date: { [Op.between]: [Start_Date, End_Date || new Date('9999-12-31')] },
        ID_Company
      }
    });

    const conflictingAppointments = [];
    for (const schedule of overlappingSchedules) {
      const endDateToUpdate = new Date(Start_Date).setDate(new Date(Start_Date).getDate() - 1);
      const appointments = await Appointment.findAll({
        where: {
          ID_RegularSchedule: schedule.ID_RegularSchedule,
          Date: { [Op.gt]: endDateToUpdate }
        }
      });
      if (appointments.length > 0) {
        conflictingAppointments.push(...appointments);
      }
    }
  
    if (overlappingSchedules.length > 0 || 
        overlappingAppointments.length > 0 || 
        conflictingAppointments.length > 0) {
      if (!force) {
        return res.status(400).json({ 
          message: 'The schedule overlaps with existing schedules or appointments for the teacher.', 
          overlappingSchedules, 
          overlappingAppointments,
          conflictingAppointments
        });
      } else {
        // Atualizar registros em sobreposição
        await sequelize.transaction(async (t) => {
          for (const schedule of overlappingSchedules) {
            const endDateToUpdate = new Date(Start_Date).setDate(new Date(Start_Date).getDate() - 1);
            await schedule.update({ End_Date: endDateToUpdate }, { transaction: t });  
            
            const appointments = await Appointment.findAll({
              where: {
                ID_RegularSchedule: schedule.ID_RegularSchedule,
                Date: { [Op.gt]: endDateToUpdate }
              }
            });            

            for (const appointment of appointments) {
              await appointment.update({ Status: 'canceled' }, { transaction: t });
            }
          }

          for (const appointment of overlappingAppointments) {
            await appointment.update({ Status: 'canceled' }, { transaction: t });
          }
        });
      }
    }
  
      const newSchedule = await RegularSchedule.create({
        ID_Teacher,
        Day_of_Week,
        Start_Time,
        End_Time,
        Capacity,
        Available_Capacity: Capacity,
        ID_Company,
        ID_Specialty,
        Start_Date,
        End_Date
      });
  
      res.status(201).json(newSchedule);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  listOverlappingSchedules: async (req, res) => {
    try {
      const { ID_Teacher, Day_of_Week, Start_Time, End_Time, Start_Date, End_Date } = req.body;
      const { ID_Company } = req.user;
  
      const overlappingSchedules = await RegularSchedule.findAll({
        where: {
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
        }
      });

    const overlappingAppointments = await Appointment.findAll({
      where: {
        ID_Teacher,
        ID_RegularSchedule: null,
        Day_of_Week,
        Start_Time: { [Op.lt]: End_Time },
        End_Time: { [Op.gt]: Start_Time },
        Date: { [Op.between]: [Start_Date, End_Date || new Date('9999-12-31')] },
        ID_Company
      }
    });

    const conflictingAppointments = [];
    for (const schedule of overlappingSchedules) {
      const endDateToCheck = new Date(Start_Date).setDate(new Date(Start_Date).getDate() - 1);
      const appointments = await Appointment.findAll({
        where: {
          ID_RegularSchedule: schedule.ID_RegularSchedule,
          Date: { [Op.gt]: endDateToCheck }
        }
      });
      if (appointments.length > 0) {
        conflictingAppointments.push(...appointments);
      }
    }


      res.status(200).json({ overlappingSchedules, overlappingAppointments });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  addClientToRegularSchedule: async (req, res) => {
    try {
      const { ID_RegularSchedule, ID_Client } = req.body;
      const { ID_Company } = req.user;

      const schedule = await RegularSchedule.findOne({ where: { ID_RegularSchedule, ID_Company } });
      if (!schedule) {
        return res.status(404).json({ message: 'RegularSchedule not found.' });
      }

      if (schedule.Available_Capacity <= 0) {
        return res.status(400).json({ message: 'RegularSchedule capacity is exhausted.' });
      }

      // Verifica se o cliente pertence à mesma companhia e existe
      const clientExists = await Client.findOne({ where: { ID_Client, ID_Company } });
      if (!clientExists) {
        return res.status(404).json({ message: 'Client not found.' });
      }

      // Verificar se o client já está associado ao RegularSchedule
      const existingAssociation = await ClientRegularSchedules.findOne({
        where: { ID_RegularSchedule, ID_Client }
      });

      if (existingAssociation) {
        return res.status(409).json({ message: 'This client is already associated with the RegularSchedule.' });
      }

      // Associar o Client ao RegularSchedule
      await ClientRegularSchedules.create({
        ID_RegularSchedule,
        ID_Client
      });

      // Decrementa Available_Capacity
      await RegularSchedule.update(
        { Available_Capacity: sequelize.literal('Available_Capacity - 1') },
        { where: { ID_RegularSchedule } }
      );

      res.status(200).json({ message: 'Client added to RegularSchedule successfully.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  removeClientFromRegularSchedule: async (req, res) => {
    try {
      const { ID_RegularSchedule, ID_Client } = req.body;
      const { ID_Company } = req.user;

      // Encontre o RegularSchedule correspondente e assegure que pertença à companhia correta
      const schedule = await RegularSchedule.findOne({
        where: { ID_RegularSchedule, ID_Company }
      });

      if (!schedule) {
        return res.status(404).json({ message: 'RegularSchedule not found.' });
      }

      // Verifica se a capacidade disponível já está no máximo
      if (schedule.Available_Capacity === schedule.Capacity) {
        return res.status(400).json({ message: 'Cannot remove client as the RegularSchedule is at full capacity.' });
      }

      // Encontre a associação na tabela ClientRegularSchedules para deletar
      const association = await ClientRegularSchedules.findOne({
        where: { ID_RegularSchedule, ID_Client }
      });

      if (!association) {
        return res.status(404).json({ message: 'Client is not associated with this RegularSchedule.' });
      }

      // Remova a associação
      await association.destroy();

      // Incremente Available_Capacity, garantindo que não exceda Capacity
      const updatedCapacity = Math.min(schedule.Capacity, schedule.Available_Capacity + 1);
      await RegularSchedule.update(
        { Available_Capacity: updatedCapacity },
        { where: { ID_RegularSchedule } }
      );

      res.status(200).json({ message: 'Client removed from RegularSchedule successfully and capacity updated.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateRegularSchedule: async (req, res) => {
    const { id } = req.params;
    const { Day_of_Week, Start_Time, End_Time, Capacity, ID_Specialty, ID_Teacher, Start_Date, End_Date, force } = req.body;
    const { ID_Company } = req.user;
  
    try {
      // Buscar o RegularSchedule existente
      const existingSchedule = await RegularSchedule.findOne({ where: { ID_RegularSchedule: id, ID_Company } });
      if (!existingSchedule) {
        return res.status(404).json({ message: 'RegularSchedule record not found or does not belong to your company.' });
      }

      // Substituir valores nulos pelos valores existentes
      const updatedData = {
        Day_of_Week: Day_of_Week !== undefined ? Day_of_Week : existingSchedule.Day_of_Week,
        Start_Time: Start_Time !== undefined ? Start_Time : existingSchedule.Start_Time,
        End_Time: End_Time !== undefined ? End_Time : existingSchedule.End_Time,
        Capacity: Capacity !== undefined ? Capacity : existingSchedule.Capacity,
        ID_Specialty: ID_Specialty !== undefined ? ID_Specialty : existingSchedule.ID_Specialty,
        ID_Teacher: ID_Teacher !== undefined ? ID_Teacher : existingSchedule.ID_Teacher,
        Start_Date: Start_Date !== undefined ? Start_Date : existingSchedule.Start_Date,
        End_Date: End_Date !== undefined ? End_Date : existingSchedule.End_Date,
        forceWithClient: forceWithClient !== undefined ? forceWithClient : false,
        forceWithAppointment: forceWithAppointment !== undefined ? forceWithAppointment : false
      };

      // Validar os dados atualizados com Yup
      await scheduleSchema.validate(updatedData);

      // Verificar se existem clientes associados ao RegularSchedule
      const clientCount = await ClientRegularSchedules.count({ where: { ID_RegularSchedule: id } });
      if (clientCount > 0 && !updatedData.forceWithClient) {
        return res.status(400).json({ message: 'Cannot update RegularSchedule with associated clients unless forceWithClient is true.' });
      }
      if (clientCount > updatedData.Capacity) {
        return res.status(400).json({ message: 'Capacity cannot be less than the number of associated clients.' });
      }
      updatedData.Available_Capacity = updatedData.Capacity - clientCount;

      // Verificar se existem Appointments associados ao RegularSchedule
      const associatedAppointments = await Appointment.findAll({ where: { ID_RegularSchedule: id }, include: [{ model: Client, attributes: ['Name'] }] });
      if (associatedAppointments.length > 0 && !updatedData.forceWithAppointment) {
        return res.status(400).json({ message: 'Cannot update RegularSchedule with associated appointments unless forceWithAppointment is true.' });
      }


    // Validar se o Teacher tem a Specialty
    const teacherHasSpecialty = await TeacherSpecialties.findOne({ 
      where: { ID_Teacher: updatedData.ID_Teacher, ID_Specialties: updatedData.ID_Specialty }
    });
    if (!teacherHasSpecialty) {
      return res.status(400).json({ message: 'The teacher does not have the specified specialty.' });
    }

    

    Até Aqui => Continuar ? Será que não pode ser mais simles ? tipo Encerar  um escala de um teacher,
    encerrar um horário, ambos a partir de uma data. E deste modo simplesmente não permitoir a alteração
    Deve se encerrar e fazer outro. **********************


  
      // Validar sobreposição de horário
      const overlappingSchedules = await RegularSchedule.findAll({
        where: {
          ID_RegularSchedule: { [Op.ne]: id },
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
        }
      });
  
      // Verificar sobreposição com Appointments que não têm ID_RegularSchedule
      const overlappingAppointments = await Appointment.findAll({
        where: {
          ID_Teacher,
          ID_RegularSchedule: null,
          Day_of_Week,
          Start_Time: { [Op.lt]: End_Time },
          End_Time: { [Op.gt]: Start_Time },
          Date: { [Op.between]: [Start_Date, End_Date || new Date('9999-12-31')] },
          ID_Company,
          Status: { [Op.ne]: 'canceled' }
        }
      });
  
      if (overlappingSchedules.length > 0 || overlappingAppointments.length > 0) {
        if (!force) {
          return res.status(400).json({ 
            message: 'The update results in overlapping schedules or appointments for the teacher.', 
            overlappingSchedules, 
            overlappingAppointments 
          });
        } else {
          // Atualizar registros em sobreposição
          await sequelize.transaction(async (t) => {
            for (const schedule of overlappingSchedules) {
              await schedule.update({ End_Date: new Date(Start_Date).setDate(new Date(Start_Date).getDate() - 1) }, { transaction: t });
            }
            for (const appointment of overlappingAppointments) {
              await appointment.update({ Status: 'canceled' }, { transaction: t });
            }
          });
        }
      }
  
      const updated = await RegularSchedule.update(
        { Day_of_Week, Start_Time, End_Time, Capacity, Available_Capacity, Start_Date, End_Date },
        { where: { ID_RegularSchedule: id, ID_Company } } // Restringe a atualização aos registros da companhia do usuário
      );
  
      if (updated[0] > 0) {
        res.status(200).json({ message: 'RegularSchedule record updated successfully.' });
      } else {
        res.status(404).json({ message: 'RegularSchedule record not found or does not belong to your company.' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  

  deleteRegularSchedule: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Client } = req.body;
      const { ID_Company } = req.user;

      // Verificar se existem Appointments associados ao RegularSchedule
      const associatedAppointments = await Appointment.count({
        where: { ID_RegularSchedule: id }
      });

      if (associatedAppointments > 0) {
        return res.status(400).json({ message: 'Cannot delete RegularSchedule with associated appointments.' });
      }

      // Primeiro, busca pelo RegularSchedule para verificar se ele existe e pertence à ID_Company do usuário
      const schedule = await RegularSchedule.findOne({
        where: { ID_RegularSchedule: id, ID_Company }
      });

      // Se o RegularSchedule não for encontrado, retorna um erro
      if (!schedule) {
        return res.status(404).json({ message: 'RegularSchedule record not found.' });
      }

      if (ID_Client < 0) {
        await regularScheduleController.createAppointmentFromRegularSchedule(req, res);
      } else {
        // Supondo uma relação muitos-para-muitos com uma tabela de associação
        const clientAssociations = await ClientRegularSchedules.count({
          where: { ID_RegularSchedule: id }
        });
        if (clientAssociations > 0) {
          return res.status(400).json({ message: 'Cannot delete RegularSchedule with associated clients.' });
        }

        const deleted = await RegularSchedule.destroy({
          where: { ID_RegularSchedule: id, ID_Company } // Apenas permite a exclusão se pertencer à companhia do usuário
        });

        if (deleted) {
          res.status(200).json({ message: 'RegularSchedule record deleted successfully.' });
        } else {
          res.status(404).json({ message: 'RegularSchedule record not found.' });
        }
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
          const overlappingSchedule = await RegularSchedule.findOne({
            where: {
              ID_Teacher,
              Day_of_Week: dayOfWeek,
              Start_Time: { [Op.lt]: endDateWithTime },
              End_Time: { [Op.gt]: startDateWithTime },
              ID_Company
            }
          });

          if (overlappingSchedule) {
            overlappingRecords.push(overlappingSchedule);
          } else {
            operations.push({
              ID_Teacher,
              Day_of_Week: dayOfWeek,
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
          message: 'Overlapping schedule records detected.',
          overlappingRecords
        });
      }

      // Procede com a criação de registros de RegularSchedule se não houver sobreposições
      // Utilizando uma transação para garantir a atomicidade da operação
      await sequelize.transaction(async (t) => {
        for (const operation of operations) {
          await RegularSchedule.create(operation, { transaction: t });
        }
      });

      res.status(201).json({ message: 'RegularSchedule records created successfully.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
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

          const deletedCount = await RegularSchedule.destroy({
            where: whereConditions,
            transaction: t
          });

          if (!force && deletedCount === 0) {
            throw new Error('Deletion not allowed without force for records with full capacity.');
          }
        }
      });

      res.status(200).json({ message: 'RegularSchedule records deleted based on criteria.' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteClient: async (req, res) => {
    const { ID_Client, startDate, endDate, daysOfWeek, ID_Specialty } = req.body;
    const { ID_Company } = req.user;

    try {
      const parsedStartDate = parseISO(startDate);
      const parsedEndDate = parseISO(endDate);

      // Assegurar que as datas estão em formato válido e o intervalo é lógico
      if (!parsedStartDate || !parsedEndDate || parsedEndDate < parsedStartDate) {
        return res.status(400).json({ message: 'Invalid date range provided.' });
      }

      // Buscar por todas as associações ClientRegularSchedules que correspondem aos critérios
      const associations = await ClientRegularSchedules.findAll({
        include: [{
          model: RegularSchedule,
          required: true,
          where: {
            ID_Company,
            ...(ID_Specialty && { ID_Specialty }),
            Day_of_Week: daysOfWeek ? { [Op.in]: daysOfWeek } : undefined,
            Date: { [Op.between]: [startDate, endDate] }
          }
        }],
        where: { ID_Client }
      });

      // Nenhuma associação encontrada
      if (associations.length === 0) {
        return res.status(404).json({ message: 'No associations found for given criteria.' });
      }

      await sequelize.transaction(async (t) => {
        for (const association of associations) {
          // Remover a associação
          await association.destroy({ transaction: t });

          // Incrementar Available_Capacity em um para o RegularSchedule relacionado
          await RegularSchedule.increment('Available_Capacity', { by: 1, where: { ID_RegularSchedule: association.ID_RegularSchedule }, transaction: t });
        }
      });

      res.status(200).json({ message: `Client associations removed successfully. Total: ${associations.length}` });
    } catch (error) {
      console.error('Failed to delete client associations:', error);
      res.status(400).json({ error: error.message });
    }
  },

  listRegularSchedules: async (req, res) => {
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

      // Preparando para filtrar por ID_Client
      if (ID_Client) {
        include.push({
          model: Client,
          as: 'Clients', // Ajuste 'as' conforme sua associação
          where: { ID_Client: ID_Client },
          through: { attributes: [] } // Esconde os atributos da tabela de junção, se necessário
        });
      } else if (listClient === 'true') { // Se listClient for verdadeiro, mas sem ID_Client específico
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
      res.status(400).json({ error: error.message });
    }
  },

  createAppointmentFromRegularSchedule: async (req, res) => {
    try {
      const { ID_RegularSchedule, ID_Client } = req.body;
      const { ID_Company } = req.user;

      // Verificar se o RegularSchedule existe e pertence à mesma companhia
      const regularSchedule = await RegularSchedule.findOne({
        where: { ID_RegularSchedule, ID_Company }
      });
      if (!regularSchedule) {
        return res.status(404).json({ message: 'RegularSchedule not found.' });
      }

      if (ID_Client < 0) {
        // Obter todos os clientes associados ao RegularSchedule
        const clientAssociations = await ClientRegularSchedules.findAll({
          where: { ID_RegularSchedule }
        });

        for (const association of clientAssociations) {
          // Verificar se já existe um Appointment com esses dados, independentemente do status
          const existingAppointment = await Appointment.findOne({
            where: {
              ID_RegularSchedule,
              ID_Client: association.ID_Client
            }
          });

          if (!existingAppointment) {
            // Criar o novo Appointment
            await Appointment.create({
              ID_RegularSchedule,
              ID_Company,
              ID_Teacher: regularSchedule.ID_Teacher,
              ID_Specialty: regularSchedule.ID_Specialty,
              ID_Client: association.ID_Client,
              Date: regularSchedule.Date,
              Day_of_Week: regularSchedule.Day_of_Week,
              Start_Time: regularSchedule.Start_Time,
              End_Time: regularSchedule.End_Time,
              Status: 'scheduled'
            });
          }
        }

        res.status(201).json({ message: 'Appointments created for all associated clients successfully.' });
      } else {
        // Verificar se o cliente fornecido é um dos clientes associados ao RegularSchedule
        const clientAssociation = await ClientRegularSchedules.findOne({
          where: { ID_RegularSchedule, ID_Client }
        });
        if (!clientAssociation) {
          return res.status(400).json({ message: 'Client is not associated with this RegularSchedule.' });
        }

        // Verificar se já existe um Appointment com esses dados, independentemente do status
        const existingAppointment = await Appointment.findOne({
          where: {
            ID_RegularSchedule,
            ID_Client
          }
        });
        if (existingAppointment) {
          return res.status(409).json({ message: 'An appointment with these details already exists.' });
        }

        // Criar o novo Appointment
        const newAppointment = await Appointment.create({
          ID_RegularSchedule,
          ID_Company,
          ID_Teacher: regularSchedule.ID_Teacher,
          ID_Specialty: regularSchedule.ID_Specialty,
          ID_Client,
          Date: regularSchedule.Date,
          Day_of_Week: regularSchedule.Day_of_Week,
          Start_Time: regularSchedule.Start_Time,
          End_Time: regularSchedule.End_Time,
          Status: 'scheduled'
        });

        res.status(201).json(newAppointment);
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  createAllAppointmentsFromRegularSchedule: async (req, res) => {
    req.body.ID_Client = -1;
    await regularScheduleController.createAppointmentFromRegularSchedule(req, res);
  }
};

module.exports = regularScheduleController;
