const express = require('express');
const router = express.Router();
const {
  addResult,
  getStudentResults,
  updateResult,
  deleteResult,
  getClassAnalytics,
  getSubjectAnalytics,
  getToppers,
  getFailedStudents,
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');
const { resultRules } = require('../middleware/validators');

router.use(protect);

router.post('/', authorize('admin', 'teacher'), resultRules, addResult);
router.get('/student/:studentId', authorize('admin', 'teacher', 'student'), getStudentResults);
router.put('/:id', authorize('admin', 'teacher'), updateResult);
router.delete('/:id', authorize('admin'), deleteResult);

// Analytics routes
router.get('/analytics/class', authorize('admin', 'teacher'), getClassAnalytics);
router.get('/analytics/subject', authorize('admin', 'teacher'), getSubjectAnalytics);
router.get('/analytics/toppers', authorize('admin', 'teacher'), getToppers);
router.get('/analytics/failed', authorize('admin', 'teacher'), getFailedStudents);

module.exports = router;
