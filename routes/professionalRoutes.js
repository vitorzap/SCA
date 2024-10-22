const express = require('express');
const router = express.Router();
const professionalController = require('../controllers/professionalController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/professionals', verifyToken, professionalController.create);
router.get('/professionals', verifyToken, professionalController.getAll);
router.get('/professionals/:id', verifyToken, professionalController.getById);
router.get('/professionals/getbyname/:name', verifyToken, professionalController.getByName);
router.get('/professionals/getbyspecialty/:specialtyId', verifyToken, professionalController.getBySpecialty);
router.put('/professionals/:id', verifyToken, professionalController.update);
router.delete('/professionals/:id', verifyToken, professionalController.delete);
router.put('/professionals/:id/specialties', verifyToken, professionalController.updateSpecialties);

module.exports = router;