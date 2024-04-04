const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const timeTableController = require('../controllers/timeTableController');


// Criar um novo TimeTable
router.post('/timeTables', verifyToken, timeTableController.createTimeTable);
// Atualizar um TimeTable
router.put('/timeTables/:id', verifyToken, timeTableController.updateTimeTable);
// Remover um cliente de um TimeTable
router.delete('/timeTables/:id', verifyToken, timeTableController.deleteTimeTable);
//
//
// Adicionar um cliente a um TimeTable
router.post('/timeTables/addClient', verifyToken, timeTableController.addClient);
// Remover um cliente de um TimeTable
router.post('/timeTables/removeClient', verifyToken, timeTableController.removeClient);
// Remover um cliente de TimeTables em um intervalo específico
router.post('/timeTables/range/deleteClient', verifyToken, timeTableController.deleteClient);
//
//
// Criar TimeTables em um intervalo de datas
router.post('/timeTables/range/create', verifyToken, timeTableController.createInInterval);
// Excluir TimeTables em um intervalo de datas
router.post('/timeTables/range/delete', verifyToken, timeTableController.deleteInInterval);
//
//
// Listar TimeTables
router.get('/timeTables', verifyToken, timeTableController.listTimeTables);

module.exports = router;
