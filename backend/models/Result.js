const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    marks: { type: Number, required: true, min: 0, max: 100 },
    maxMarks: { type: Number, default: 100 },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    examType: {
      type: String,
      enum: ['unit-test', 'mid-term', 'final'],
      required: true,
    },
    academicYear: { type: String, required: true },
    subjects: { type: [subjectSchema], required: true, validate: v => v.length > 0 },
    total: { type: Number },
    maxTotal: { type: Number },
    average: { type: Number },
    percentage: { type: Number },
    grade: { type: String },
    isPassed: { type: Boolean },
  },
  { timestamps: true }
);

// Auto-calculate total, average, percentage, grade before saving
resultSchema.pre('save', function (next) {
  this.total = this.subjects.reduce((sum, s) => sum + s.marks, 0);
  this.maxTotal = this.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
  this.average = parseFloat((this.total / this.subjects.length).toFixed(2));
  this.percentage = parseFloat(((this.total / this.maxTotal) * 100).toFixed(2));
  this.isPassed = this.subjects.every(s => s.marks >= 33);

  if (this.percentage >= 90) this.grade = 'A+';
  else if (this.percentage >= 80) this.grade = 'A';
  else if (this.percentage >= 70) this.grade = 'B+';
  else if (this.percentage >= 60) this.grade = 'B';
  else if (this.percentage >= 50) this.grade = 'C';
  else if (this.percentage >= 33) this.grade = 'D';
  else this.grade = 'F';

  next();
});

resultSchema.index({ studentId: 1, examType: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
