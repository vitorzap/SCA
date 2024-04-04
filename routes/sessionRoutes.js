const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// No authentication middleware is needed for login
router.post('/login', sessionController.login);

// Logout and changePassword routes require user to be authenticated
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/logout', verifyToken, sessionController.logout);
router.post('/changePassword', verifyToken, sessionController.changePassword);

module.exports = router;
