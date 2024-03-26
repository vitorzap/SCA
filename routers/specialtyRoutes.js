const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialtyController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/specialties', verifyToken, specialtyController.createSpecialty);
router.get('/specialties', verifyToken, specialtyController.getAllSpecialties);
router.get('/specialties/:id', verifyToken, specialtyController.getSpecialtyById);
router.put('/specialties/:id', verifyToken, specialtyController.updateSpecialty);
router.delete('/specialties/:id', verifyToken, specialtyController.deleteSpecialty);

module.exports = router;
