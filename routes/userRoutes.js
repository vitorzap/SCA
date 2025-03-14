const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware to verify if the user is authenticated
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeByUserLevel } = require('../utils/auth/authorizationHelper');
//router.post('/users', userController.createUser);
//router.post('/users', verifyToken, userController.create);
//router.get('/users', verifyToken, userController.getAll);
router.post('/users', userController.create);
router.get('/users', userController.getAll);
router.get('/users/:id', userController.getById);
router.get('/users/name/:name', userController.getByName);
router.put('/users/:id', userController.update);
router.delete('/users/:id', userController.delete);
// router.get('/users/:id', verifyToken, userController.getById);
// router.get('/users/name/:name', verifyToken, 
//             authorizeByUserLevel([0,1]), userController.getByName);
// router.put('/users/:id', verifyToken, userController.update);
// router.delete('/users/:id', verifyToken, userController.delete);

module.exports = router;
