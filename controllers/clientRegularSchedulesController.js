const { ClientRegularSchedules, Client, RegularSchedule, sequelize } = require('../models');
const { Op } = require('sequelize');
const { validateDate, validateTime } = require('../utils/validationHelpers');
const logger = require('../utils/logger'); // Assuming there's a logger utility

const clientRegularSchedulesController = {
  // Incluir uma nova associação ClientRegularSchedules
  create: async (req, res) => {
    let transaction;
    try {
      const { ID_Client, ID_RegularSchedule } = req.body;
      const { ID_Company } = req.user;

      // Iniciar a transação
      transaction = await sequelize.transaction();

      // Verifica se o RegularSchedule pertence à mesma companhia e existe
      const schedule = await RegularSchedule.findOne({
        where: { ID_RegularSchedule, ID_Company },
        transaction
      });

      if (!schedule) {
        return res.status(404).json({ message: 'RegularSchedule not found.' });
      }

      // Calcula a capacidade disponível como Capacity - Current_Clients
      const availableCapacity = schedule.Capacity - schedule.Current_Clients;
      if (availableCapacity <= 0) {
        return res.status(400).json({ message: 'RegularSchedule capacity is exhausted.' });
      }

      // Verifica se o cliente pertence à mesma companhia e existe
      const clientExists = await Client.findOne({ where: { ID_Client, ID_Company }, transaction });
      if (!clientExists) {
        return res.status(404).json({ message: 'Client not found.' });
      }

      // Verificar se o client já está associado ao RegularSchedule
      const existingAssociation = await ClientRegularSchedules.findOne({
        where: { ID_RegularSchedule, ID_Client },
        transaction
      });
      if (existingAssociation) {
        return res.status(409).json({ message: 'This client is already associated with the RegularSchedule.' });
      }

      // Associar o Client ao RegularSchedule
      await ClientRegularSchedules.create({
        ID_RegularSchedule,
        ID_Client
      }, { transaction });

      // Atualiza o número de clientes atuais (incrementa Current_Clients)
      await RegularSchedule.update(
        { Current_Clients: sequelize.literal('Current_Clients + 1') },
        { where: { ID_RegularSchedule }, transaction }
      );

      await transaction.commit();
      logger.info(`Client ${ID_Client} added to RegularSchedule ${ID_RegularSchedule} successfully.`);
      res.status(200).json({ message: 'Client added to RegularSchedule successfully.' });
    } catch (error) {
      if (transaction) await transaction.rollback();
      logger.error('Error adding client to RegularSchedule:', error);
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  // Excluir uma associação ClientRegularSchedules por ID
  delete: async (req, res) => {
    let transaction;
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;

      // Iniciar a transação
      transaction = await sequelize.transaction();

      // Verificar se a associação existe e pertence à mesma companhia
      const clientRegularSchedule = await ClientRegularSchedules.findOne({
        where: { ID_ClientRegularSchedules: id },
        include: [
          { model: Client, as: 'Client', where: { ID_Company }, required: true },
          { model: RegularSchedule, as: 'RegularSchedule', where: { ID_Company }, required: true }
        ],
        transaction
      });

      if (!clientRegularSchedule) {
        return res.status(404).json({ message: 'ClientRegularSchedule not found.' });
      }

      const { ID_RegularSchedule } = clientRegularSchedule;

      // Deletar a associação
      await ClientRegularSchedules.destroy({
        where: { ID_ClientRegularSchedules: id },
        transaction
      });

      // Atualiza o número de clientes atuais (decrementa Current_Clients)
      await RegularSchedule.update(
        { Current_Clients: sequelize.literal('Current_Clients - 1') },
        { where: { ID_RegularSchedule }, transaction }
      );

      await transaction.commit();
      logger.info(`ClientRegularSchedule ${id} deleted successfully.`);
      res.status(200).json({ message: 'Client removed from RegularSchedule successfully and capacity updated.' });
    } catch (error) {
      if (transaction) await transaction.rollback();
      logger.error('Error deleting ClientRegularSchedule:', error);
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  // Consultar uma associação específica por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const { ID_Company } = req.user;

      const association = await ClientRegularSchedules.findOne({
        where: { ID_ClientRegularSchedules: id },
        include: [
          { model: Client, as: 'Client', where: { ID_Company }, required: true },
          { model: RegularSchedule, as: 'RegularSchedule', where: { ID_Company }, required: true }
        ]
      });

      if (association) {
        res.status(200).json(association);
      } else {
        res.status(404).json({ message: 'ClientRegularSchedule not found.' });
      }
    } catch (error) {
      logger.error('Error fetching ClientRegularSchedule by ID:', error);
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  // Listar todas as RegularSchedules associadas por cliente com filtros opcionais
  getSchedulesByClient: async (req, res) => {
    try {
      const { ID_Client } = req.params;
      const { ID_Company } = req.user;
      const { Day_of_Week, Start_Time, Start_Date, End_Date } = req.query;

      // Validate query parameters
      if (Start_Date && !validateDate(Start_Date)) {
        return res.status(400).json({ message: 'Invalid Start_Date format.' });
      }
      if (End_Date && !validateDate(End_Date)) {
        return res.status(400).json({ message: 'Invalid End_Date format.' });
      }
      if (Start_Time && !validateTime(Start_Time)) {
        return res.status(400).json({ message: 'Invalid Start_Time format.' });
      }

      // Verificar se o Client pertence à mesma companhia do usuário
      const client = await Client.findOne({ where: { ID_Client, ID_Company } });

      if (!client) {
        return res.status(403).json({ message: 'Client not found or does not belong to your company.' });
      }

      const scheduleConditions = {};
      if (Day_of_Week) {
        scheduleConditions.Day_of_Week = Day_of_Week;
      }
      if (Start_Time) {
        scheduleConditions.Start_Time = { [Op.gte]: Start_Time };
      }
      if (Start_Date && End_Date) {
        scheduleConditions.Start_Date = { [Op.between]: [Start_Date, End_Date] };
      }

      const clientWithSchedules = await Client.findOne({
        where: { ID_Client },
        include: [{
          model: RegularSchedule,
          as: 'RegularSchedules',
          where: scheduleConditions,
          required: false
        }]
      });

      if (clientWithSchedules) {
        res.status(200).json(clientWithSchedules);
      } else {
        res.status(404).json({ message: 'Client or RegularSchedules not found.' });
      }
    } catch (error) {
      logger.error('Error fetching RegularSchedules by Client:', error);
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  },

  // Listar todos os clientes de um RegularSchedule
  getBySchedule: async (req, res) => {
    try {
      const { ID_RegularSchedule } = req.params;

      const scheduleWithClients = await RegularSchedule.findOne({
        where: { ID_RegularSchedule },
        include: [{
          model: Client,
          as: 'Clients',
          through: { attributes: [] }  // Avoid fetching unnecessary join table attributes
        }]
      });

      if (scheduleWithClients) {
        res.status(200).json(scheduleWithClients);
      } else {
        res.status(404).json({ message: 'RegularSchedule or Clients not found.' });
      }
    } catch (error) {
      logger.error('Error fetching Clients by RegularSchedule:', error);
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.error('Error:', error);
      }
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = clientRegularSchedulesController;