const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const regularScheduleController = require('../controllers/regularScheduleController');

router.post('/regularSchedules', verifyToken, regularScheduleController.create);
router.put('/regularSchedules/:id', verifyToken, regularScheduleController.update);
router.delete('/regularSchedules/:id', verifyToken, regularScheduleController.delete);
router.get('/regularSchedules', verifyToken, regularScheduleController.listByParam);
router.get('/regularSchedules/:id', verifyToken, regularScheduleController.getById);

module.exports = router;