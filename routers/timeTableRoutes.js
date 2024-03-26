const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const timeTableController = require('../controllers/timeTableController');

router.post('/timeTables/range/create', verifyToken, timeTableController.createInInterval);
router.post('/timeTables/range/delete', verifyToken, timeTableController.deleteInInterval);

// Additional CRUD and special routes for TimeTable...

module.exports = router;
