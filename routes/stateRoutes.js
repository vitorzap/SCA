const express = require('express');
const { makeInvoker } = require('awilix-express');
const router = express.Router();

// Middlewares
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeByUserLevel } = require('../utils/auth/authorizationHelper');

// Obtém o invocador do controlador (DI resolve as dependências)
// const stateController = makeInvoker((container) => container.resolve('stateController'));
const stateController = makeInvoker((cradle) => cradle.stateController);

// Define the routes
router.post('/state',verifyToken, authorizeByUserLevel([0]),stateController('create'));
router.get('/state',verifyToken,stateController('getAll'));
router.get('/state/:id', verifyToken, stateController('getById'));
router.put('/state/:id',verifyToken,authorizeByUserLevel([0]),stateController('update'));
router.delete('/state/:id',verifyToken,authorizeByUserLevel([0]),stateController('delete'));

module.exports = router;