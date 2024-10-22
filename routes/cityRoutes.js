const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/cities', verifyToken, cityController.create);
router.get('/cities', verifyToken, cityController.listAll);
router.get('/cities/:id', verifyToken, cityController.getById);
router.put('/cities/:id', verifyToken, cityController.update);
router.delete('/cities/:id', verifyToken, cityController.delete);

module.exports = router;
