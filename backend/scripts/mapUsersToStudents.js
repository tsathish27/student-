// Script to map Users (role: student) to Student documents
// For any User with role 'student' that does not have a Student document, create one.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const connectDB = require('../config/db');

async function mapUsersToStudents() {
  await connectDB();
  const users = await User.find({ role: 'student' });
  let created = 0, linked = 0;

  for (const user of users) {
    // Check if a Student with this userId exists
    let student = await Student.findOne({ userId: user._id });
    if (!student) {
      // Try to find by email (legacy import)
      student = await Student.findOne({ email: user.email });
      if (student) {
        student.userId = user._id;
        await student.save();
        linked++;
        continue;
      }
      // Create new Student document with minimal info
      await Student.create({
        userId: user._id,
        section: 'CSE-01', // Set sensible defaults or update as needed
        year: 'E-1',
        rollNo: user.email.split('@')[0],
        idNumber: user._id.toString().slice(-6),
        phone: '',
      });
      created++;
    }
  }
  console.log(`Mapping complete. Linked: ${linked}, Created: ${created}`);
  await mongoose.disconnect();
}

mapUsersToStudents().catch(e => {
  console.error('Error mapping users to students:', e);
  process.exit(1);
});
