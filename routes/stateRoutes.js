// stateRoutes.js
const express = require('express');
const router = express.Router();
const stateController = require('../controllers/stateController');

// Middleware for authentication if needed
// const { verifyToken } = require('../middleware/authMiddleware');

router.post('/states', stateController.createState); // Create a new state
router.get('/states', stateController.listAll); // List all states
router.get('/states/:id', stateController.getStateById); // Get a state by ID
router.put('/states/:id', stateController.updateState); // Update a state
router.delete('/states/:id', stateController.deleteState); // Delete a state

module.exports = router;
