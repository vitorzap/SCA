const express = require('express');
const { makeInvoker } = require('awilix-express');
const router = express.Router();

// Middlewares
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeByUserLevel } = require('../utils/auth/authorizationHelper');

// const companyController = makeInvoker((container) => container.resolve('companyController'));
const companyController = makeInvoker((cradle) => cradle.companyController);

// Define the routes
router.post('/company',verifyToken,authorizeByUserLevel([0]),companyController('create'));
router.get('/company',verifyToken,authorizeByUserLevel([0]),companyController('getAll'));
router.get('/company/byname',verifyToken,authorizeByUserLevel([0]),companyController('getByName'));
router.get('/company/:id',verifyToken,companyController('getById'));
router.put('/company/:id',verifyToken,authorizeByUserLevel([0]),companyController('update'));
router.delete('/company/:id',verifyToken,authorizeByUserLevel([0]),companyController('delete'));

module.exports = router;
  