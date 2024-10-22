const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Middleware de autenticação
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/clients', verifyToken, clientController.create);
router.get('/clients', verifyToken, clientController.getAll);
router.get('/clients/:id', verifyToken, clientController.getById);
router.get('/clients/getbyname/:name', verifyToken, clientController.getByName); // Rota renomeada
router.put('/clients/:id', verifyToken, clientController.update);
router.delete('/clients/:id', verifyToken, clientController.delete);

module.exports = router;