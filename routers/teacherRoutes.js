const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/teachers', verifyToken, teacherController.createTeacher);
router.get('/teachers', verifyToken, teacherController.getAllTeachers);
router.get('/teachers/:id', verifyToken, teacherController.getTeacherById);
router.put('/teachers/:id', verifyToken, teacherController.updateTeacher);
router.delete('/teachers/:id', verifyToken, teacherController.deleteTeacher);

module.exports = router;
