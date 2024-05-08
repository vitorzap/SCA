const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware to verify if the user is authenticated
const { verifyToken, isAdminOrRoot} = require('../middleware/authMiddleware');

// router.post('/users', userController.createUser);
router.post('/users', verifyToken, userController.createUser);
router.get('/users', verifyToken, userController.getAllUsers);
router.get('/users/:id', verifyToken, userController.getUserById);
router.get('/users/name/:name', verifyToken, isAdminOrRoot, userController.getUsersByName);
router.put('/users/:id', verifyToken, userController.updateUser);
router.delete('/users/:id', verifyToken, userController.deleteUser);

module.exports = router;
