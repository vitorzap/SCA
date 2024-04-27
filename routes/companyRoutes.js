// CompanyRoutes.js
const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

const { verifyToken, isRoot } = require('../middleware/authMiddleware');

router.post('/companies', verifyToken, isRoot, companyController.createCompany);
router.get('/companies', verifyToken, isRoot, companyController.getAllCompanies);
router.get('/companies/:id', verifyToken, isRoot, companyController.getCompanyById);
router.get('/companies/name/:name', verifyToken, isRoot, companyController.getCompaniesByName);
router.put('/companies/:id', verifyToken, isRoot, companyController.updateCompany);
router.delete('/companies/:id', verifyToken, isRoot, companyController.deleteCompany);

module.exports = router;
