const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeByUserLevel } = require('../utils/authorizationHelper');

router.post('/companies', verifyToken, authorizeByUserLevel([0]), companyController.create);
router.get('/companies', verifyToken, authorizeByUserLevel([0]), companyController.getAll);
router.get('/companies/:id', verifyToken, authorizeByUserLevel([0]), companyController.getById);
router.get('/companies/getbyname/:name', verifyToken, authorizeByUserLevel([0]), companyController.getByName);
router.put('/companies/:id', verifyToken, authorizeByUserLevel([0]), companyController.update);
router.delete('/companies/:id', verifyToken, authorizeByUserLevel([0]), companyController.delete);

module.exports = router;
