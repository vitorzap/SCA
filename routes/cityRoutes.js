const express = require('express');
const { makeInvoker } = require('awilix-express');
const router = express.Router();

// Middlewares
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeByUserLevel } = require('../utils/auth/authorizationHelper');

// Get the controller's invoker (DI resolves dependencies)
// const cityController = makeInvoker((container) => container.resolve('cityController'));
const cityController = makeInvoker((cradle) => cradle.cityController);


// Define the routes
router.post('/city',verifyToken,authorizeByUserLevel([0]),cityController('create'));
router.get('/city',verifyToken,cityController('getAll'));
router.get('/city/bystate',verifyToken,cityController('getAllByState'));
router.get('/city/:id',verifyToken,cityController('getById'));
router.put('/city/:id',verifyToken,authorizeByUserLevel([0]),cityController('update'));
router.delete('/city/:id',verifyToken,authorizeByUserLevel([0]),cityController('delete'));

module.exports = router;