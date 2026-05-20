const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const { studentRules } = require('../middleware/validators');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'teacher'), getStudents)
  .post(authorize('admin', 'teacher'), studentRules, createStudent);

router.route('/:id')
  .get(authorize('admin', 'teacher', 'student'), getStudent)
  .put(authorize('admin', 'teacher'), studentRules, updateStudent)
  .delete(authorize('admin'), deleteStudent);

module.exports = router;
