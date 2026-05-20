const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, unique: true, trim: true },
    class: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true, uppercase: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

studentSchema.index({ class: 1, section: 1 });
studentSchema.index({ name: 'text' });

module.exports = mongoose.model('Student', studentSchema);
