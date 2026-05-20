const Result = require('../models/Result');
const Student = require('../models/Student');

// @route POST /api/results
exports.addResult = async (req, res, next) => {
  try {
    const result = await Result.create(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/results/student/:studentId
exports.getStudentResults = async (req, res, next) => {
  try {
    const results = await Result.find({ studentId: req.params.studentId })
      .populate('studentId', 'name rollNumber class section')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/results/:id
exports.updateResult = async (req, res, next) => {
  try {
    // Fetch, mutate, and save to trigger pre-save hook for recalculation
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    Object.assign(result, req.body);
    await result.save();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/results/:id
exports.deleteResult = async (req, res, next) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/results/analytics/class
// Query: ?class=10&section=A&examType=final&academicYear=2024-25
exports.getClassAnalytics = async (req, res, next) => {
  try {
    const { class: cls, section, examType, academicYear } = req.query;
    if (!cls) return res.status(400).json({ success: false, message: 'Class is required' });

    const studentQuery = { class: cls };
    if (section) studentQuery.section = section.toUpperCase();

    const students = await Student.find(studentQuery).select('_id');
    const studentIds = students.map(s => s._id);

    const resultQuery = { studentId: { $in: studentIds } };
    if (examType) resultQuery.examType = examType;
    if (academicYear) resultQuery.academicYear = academicYear;

    const results = await Result.find(resultQuery).populate('studentId', 'name rollNumber section');

    const analytics = {
      totalStudents: studentIds.length,
      totalResults: results.length,
      passed: results.filter(r => r.isPassed).length,
      failed: results.filter(r => !r.isPassed).length,
      averagePercentage: results.length
        ? parseFloat((results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(2))
        : 0,
      gradeDistribution: results.reduce((acc, r) => {
        acc[r.grade] = (acc[r.grade] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json({ success: true, analytics, data: results });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/results/analytics/subject
// Query: ?subject=Math&class=10&examType=final&academicYear=2024-25
exports.getSubjectAnalytics = async (req, res, next) => {
  try {
    const { subject, class: cls, examType, academicYear } = req.query;
    if (!subject) return res.status(400).json({ success: false, message: 'Subject name is required' });

    const matchStage = {};
    if (examType) matchStage.examType = examType;
    if (academicYear) matchStage.academicYear = academicYear;

    if (cls) {
      const students = await Student.find({ class: cls }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    }

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$subjects' },
      { $match: { 'subjects.name': { $regex: new RegExp(subject, 'i') } } },
      {
        $group: {
          _id: '$subjects.name',
          totalStudents: { $sum: 1 },
          avgMarks: { $avg: '$subjects.marks' },
          maxMarks: { $max: '$subjects.marks' },
          minMarks: { $min: '$subjects.marks' },
          passed: { $sum: { $cond: [{ $gte: ['$subjects.marks', 33] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $lt: ['$subjects.marks', 33] }, 1, 0] } },
        },
      },
      {
        $project: {
          subject: '$_id',
          totalStudents: 1,
          avgMarks: { $round: ['$avgMarks', 2] },
          maxMarks: 1,
          minMarks: 1,
          passed: 1,
          failed: 1,
          _id: 0,
        },
      },
    ];

    const data = await Result.aggregate(pipeline);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/results/analytics/toppers
// Query: ?class=10&section=A&examType=final&academicYear=2024-25&limit=5
exports.getToppers = async (req, res, next) => {
  try {
    const { class: cls, section, examType, academicYear, limit = 5 } = req.query;

    const studentQuery = {};
    if (cls) studentQuery.class = cls;
    if (section) studentQuery.section = section.toUpperCase();

    const students = await Student.find(studentQuery).select('_id');
    const resultQuery = { studentId: { $in: students.map(s => s._id) } };
    if (examType) resultQuery.examType = examType;
    if (academicYear) resultQuery.academicYear = academicYear;

    const toppers = await Result.find(resultQuery)
      .populate('studentId', 'name rollNumber class section')
      .sort({ percentage: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: toppers.length, data: toppers });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/results/analytics/failed
// Query: ?class=10&section=A&examType=final&academicYear=2024-25
exports.getFailedStudents = async (req, res, next) => {
  try {
    const { class: cls, section, examType, academicYear } = req.query;

    const studentQuery = {};
    if (cls) studentQuery.class = cls;
    if (section) studentQuery.section = section.toUpperCase();

    const students = await Student.find(studentQuery).select('_id');
    const resultQuery = { studentId: { $in: students.map(s => s._id) }, isPassed: false };
    if (examType) resultQuery.examType = examType;
    if (academicYear) resultQuery.academicYear = academicYear;

    const failed = await Result.find(resultQuery)
      .populate('studentId', 'name rollNumber class section')
      .sort({ percentage: 1 });

    res.json({ success: true, count: failed.length, data: failed });
  } catch (err) {
    next(err);
  }
};
