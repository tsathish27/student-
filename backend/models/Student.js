const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  section: { type: String, enum: [
    'CSE-01', 'CSE-02', 'CSE-03', 'CSE-04', 'CSE-05', 'CSE-06'], required: true },
  year: { type: String, enum: ['E-1', 'E-2', 'E-3', 'E-4'], required: true },
  rollNo: { type: String, required: true },
  idNumber: { type: String, required: true },
  phone: { type: String }
  // Removed marks and attendance arrays as these are managed in separate models
});

module.exports = mongoose.model('Student', studentSchema);
