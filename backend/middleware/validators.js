const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg) });
  }
  next();
};

exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'teacher', 'student']).withMessage('Invalid role'),
  validate,
];

exports.loginRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

exports.studentRules = [
  body('name').trim().notEmpty().withMessage('Student name is required'),
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  body('class').trim().notEmpty().withMessage('Class is required'),
  body('section').trim().notEmpty().withMessage('Section is required'),
  validate,
];

exports.resultRules = [
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('examType').isIn(['unit-test', 'mid-term', 'final']).withMessage('Invalid exam type'),
  body('academicYear').trim().notEmpty().withMessage('Academic year is required'),
  body('subjects').isArray({ min: 1 }).withMessage('At least one subject is required'),
  body('subjects.*.name').trim().notEmpty().withMessage('Subject name is required'),
  body('subjects.*.marks').isFloat({ min: 0, max: 100 }).withMessage('Marks must be between 0 and 100'),
  validate,
];
