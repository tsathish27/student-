const Student = require('../models/Student');
const User = require('../models/User');

// Get the authenticated student's profile
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let student = await Student.findOne({ userId }).populate('userId');
    if (!student) {
      // Auto-create student profile if missing (for dev convenience)
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found', received: req.body });
      student = new Student({
        userId: user._id,
        section: 'CSE-01', // default or fetch from somewhere
        year: 'E-1', // default or fetch from somewhere
        rollNo: user.email ? user.email.split('@')[0] : 'unknown',
        idNumber: user._id.toString().slice(-6),
        phone: ''
      });
      await student.save();
      student = await Student.findOne({ userId }).populate('userId');
    }
    // Return a flat profile object: name/email from user, rest from student
    const profile = {
      name: student.userId && student.userId.name,
      email: student.userId && student.userId.email,
      section: student.section,
      year: student.year,
      semester: student.semester,
      rollNo: student.rollNo,
      idNumber: student.idNumber,
      phone: student.phone,
      _id: student._id
    };
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack, received: req.body });
  }
};

// Admin: Add a new student (and user)
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, section, year, rollNo, idNumber, phone, profileData } = req.body;
    // Create user first
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists', received: req.body });
    const passwordHash = await require('bcryptjs').hash(password, 10);
    const user = new User({ name, email, passwordHash, role: 'student', profileData });
    await user.save();
    // Create student profile
    const student = new Student({ userId: user._id, section, year, rollNo, idNumber, phone });
    await student.save();
    res.status(201).json({ message: 'Student created', student });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack, received: req.body });
  }
};

// Admin: Get all students (with filters)
exports.getStudents = async (req, res) => {
  try {
    const { section, year, search } = req.query;
    const filter = {};
    if (section) filter.section = section;
    if (year) filter.year = year;
    if (search) filter.$or = [
      { rollNo: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
    const students = await Student.find(filter).populate('userId');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack, received: req.body });
  }
};

// Admin: Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, section, year, rollNo, idNumber, phone, profileData } = req.body;
    // Update Student fields
    const student = await Student.findByIdAndUpdate(id, { section, year, rollNo, idNumber, phone }, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found', received: req.body });
    // Update User fields
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (email) userUpdate.email = email;
    if (profileData) userUpdate.profileData = profileData;
    if (password) {
      userUpdate.passwordHash = await require('bcryptjs').hash(password, 10);
    }
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(student.userId, userUpdate);
    }
    res.json({ message: 'Student updated', student });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack, received: req.body });
  }
};

// Admin: Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id).populate('userId');
    if (!student) return res.status(404).json({ message: 'Student not found', received: req.body });
    await User.findByIdAndDelete(student.userId);
    // Delete registration request/status if exists
    const StudentRegistrationRequest = require('../models/StudentRegistrationRequest');
    await StudentRegistrationRequest.deleteOne({ email: student.userId.email });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack, received: req.body });
  }
};

// Admin: Bulk delete students
exports.bulkDeleteStudents = async (req, res) => {
  try {
    console.log('[bulkDeleteStudents][START]', req.body);
    // Log the body for debugging
    console.log('[bulkDeleteStudents][BODY]', req.body);
    let ids = req.body.ids;

    // Defensive: handle both object and string body
    if (!ids && typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        ids = parsed.ids;
      } catch (e) {
        console.error('[bulkDeleteStudents] Malformed request body:', req.body);
        return res.status(400).json({ message: 'Malformed request body', received: req.body });
      }
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      console.error('[bulkDeleteStudents] No student IDs provided:', req.body);
      return res.status(400).json({ message: 'No student IDs provided', received: req.body });
    }

    // Validate all IDs
    const mongoose = require('mongoose');
    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      console.error('[bulkDeleteStudents] Invalid student IDs:', invalidIds);
      return res.status(400).json({ message: 'Invalid student IDs', invalidIds, received: req.body });
    }
    // Find all students to delete
    const students = await Student.find({ _id: { $in: ids } }).populate('userId');
    if (students.length === 0) {
      console.error('[bulkDeleteStudents] No students found for provided IDs:', ids);
      return res.status(404).json({ message: 'No students found for the provided IDs', received: req.body });
    }
    // Defensive: log found students
    console.log('[bulkDeleteStudents] Students found:', students.map(s => s._id));
    // Delete associated users (validate user IDs too)
    const userIds = students.map(s => s.userId).filter(id => mongoose.Types.ObjectId.isValid(id));
    // Defensive: only attempt delete if userIds is not empty
    if (userIds.length > 0) {
      const userDelResult = await User.deleteMany({ _id: { $in: userIds } });
      console.log('[bulkDeleteStudents] User delete result:', userDelResult);
    }
    // Delete students
    const studentDelResult = await Student.deleteMany({ _id: { $in: ids } });
    console.log('[bulkDeleteStudents] Student delete result:', studentDelResult);
    // Delete registration requests for all deleted students
    const StudentRegistrationRequest = require('../models/StudentRegistrationRequest');
    const emails = students.map(s => s.userId.email);
    if (emails.length > 0) {
      await StudentRegistrationRequest.deleteMany({ email: { $in: emails } });
    }
    res.json({ message: 'Students deleted', count: students.length });
  } catch (err) {
    console.error('[bulkDeleteStudents][CATCH]', err, { body: req.body });
    if (res.headersSent) return res.end();
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack, received: req.body });
  }
};

// Get a student profile by studentId (admin or student access)
exports.getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    let student = await Student.findById(studentId).populate('userId');
    if (!student) {
      // If no Student document, try to find a User with this ID and role student
      const user = await require('../models/User').findById(studentId);
      if (user && user.role === 'student') {
        return res.json(user);
      } else {
        return res.status(404).json({ message: 'Student not found', received: req.body });
      }
    }
    // If the user is a student, ensure they can only access their own profile
    if (req.user.role === 'student' && req.user.studentId !== studentId && req.user.id !== student.userId.toString()) {
      return res.status(403).json({ message: 'Forbidden: cannot access another student profile', received: req.body });
    }
    // Return a flat profile object: name/email from user, rest from student
    const profile = {
      name: student.userId && student.userId.name,
      email: student.userId && student.userId.email,
      section: student.section,
      year: student.year,
      semester: student.semester,
      rollNo: student.rollNo,
      idNumber: student.idNumber,
      phone: student.phone,
      _id: student._id
    };
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack, received: req.body });
  }
};

// Student: Update only the semester
exports.updateSemester = async (req, res) => {
  try {
    const userId = req.user.id;
    const { semester } = req.body;
    if (!semester) return res.status(400).json({ message: 'Semester is required.' });
    const student = await Student.findOneAndUpdate(
      { userId },
      { semester },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json({ semester: student.semester });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Export all functions
module.exports = {
  getMyProfile: exports.getMyProfile,
  createStudent: exports.createStudent,
  getStudents: exports.getStudents,
  updateStudent: exports.updateStudent,
  deleteStudent: exports.deleteStudent,
  bulkDeleteStudents: exports.bulkDeleteStudents,
  getStudentProfile: exports.getStudentProfile,
  updateSemester: exports.updateSemester
};
