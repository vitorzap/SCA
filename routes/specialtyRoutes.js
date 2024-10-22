const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialtyController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/specialties', verifyToken, specialtyController.create);
router.get('/specialties', verifyToken, specialtyController.getAll);
router.get('/specialties/:id', verifyToken, specialtyController.getById);
router.put('/specialties/:id', verifyToken, specialtyController.update);
router.delete('/specialties/:id', verifyToken, specialtyController.delete);

module.exports = router;
