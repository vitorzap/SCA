const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { verifyToken,isAdminOrRoot } = require('../middleware/authMiddleware');

router.post('/teachers', verifyToken, teacherController.createTeacher);
router.get('/teachers', verifyToken, teacherController.getAllTeachers);
router.get('/teachers/:id', verifyToken, teacherController.getTeacherById);
router.put('/teachers/:id', verifyToken, teacherController.updateTeacher);
router.delete('/teachers/:id', verifyToken, teacherController.deleteTeacher);
router.put('/teachers/:id/specialties', verifyToken, teacherController.updateSpecialty);
router.get('/teachers/name/:name', verifyToken,teacherController.getTeachersByName);                                                              
router.get('/teachers/specialty/:specialtyId', verifyToken,teacherController.getTeachersBySpecialty);    
router.put('/teachers/update-specialty/:id',verifyToken,teacherController.updateSpecialty);     
                                             

module.exports = router;
