const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Get current user profile (without password hash)
exports.me = async (req, res) => {
  console.log('GET /api/auth/me', req.user);

  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    let profile = null;
    if (user.role === 'student') {
      const Student = require('../models/Student');
      profile = await Student.findOne({ userId: user._id });
    }
    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Register new user
exports.register = async (req, res) => {
  console.log('POST /api/auth/register', req.body);

  try {
    const { name, email, password, role, profileData, section, year, rollNo, idNumber, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);

    // Add student fields for student users
    const userData = { name, email, passwordHash, role, profileData };
    if (role === 'student') {
      userData.section = section;
      userData.year = year;
      userData.rollNo = rollNo;
      userData.idNumber = idNumber;
      userData.phone = phone;
    }
    const user = new User(userData);
    await user.save();
    // No need to create Student document
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login user
exports.login = async (req, res) => {
  console.log('POST /api/auth/login', req.body);

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // If student, fetch Student document and include studentId in JWT
    let studentId;
    if (user.role === 'student') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: user._id });
      if (!student) {
        return res.status(403).json({ message: 'Student profile missing for this user. Please contact admin.' });
      }
      studentId = student._id;
    }

    // JWT: For students, include studentId. For admin, do not include studentId.
    const tokenPayload = { id: user._id, role: user.role, email: user.email };
    if (user.role === 'student' && studentId) tokenPayload.studentId = studentId;

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Response user object: For students, include studentId. For admin, do not include studentId.
    const responseUser = { id: user._id, name: user.name, email: user.email, role: user.role };
    if (user.role === 'student' && studentId) responseUser.studentId = studentId;

    res.json({ token, user: responseUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
