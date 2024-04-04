const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/cities', verifyToken, cityController.createCity);
router.get('/cities', verifyToken, cityController.listAllCities);
router.get('/cities/:id', verifyToken, cityController.getCityById);
router.put('/cities/:id', verifyToken, cityController.updateCity);
router.delete('/cities/:id', verifyToken, cityController.deleteCity);

module.exports = router;
