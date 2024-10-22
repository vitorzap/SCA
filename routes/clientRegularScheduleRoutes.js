const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const clientRegularSchedulesController = require('../controllers/clientRegularSchedulesController');

router.post('/clientRegularSchedules', verifyToken, clientRegularSchedulesController.create);
router.delete('/clientRegularSchedules/:id', verifyToken, clientRegularSchedulesController.delete);
router.get('/clientRegularSchedules/:id', verifyToken, clientRegularSchedulesController.getById);
router.get('/clientRegularSchedules/getbyclient/:ID_Client', verifyToken, clientRegularSchedulesController.getSchedulesByClient);
router.get('/clientRegularSchedules/getbyschedule/:ID_RegularSchedule', verifyToken, clientRegularSchedulesController.getBySchedule);

module.exports = router;