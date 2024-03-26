const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Assuming the same middleware for authentication
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/clients', verifyToken, clientController.createClient);
router.get('/clients', verifyToken, clientController.getAllClients);
router.get('/clients/:id', verifyToken, clientController.getClientById);
router.put('/clients/:id', verifyToken, clientController.updateClient);
router.delete('/clients/:id', verifyToken, clientController.deleteClient);

module.exports = router;
