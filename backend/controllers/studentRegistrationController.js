const StudentRegistrationRequest = require('../models/StudentRegistrationRequest');
const Student = require('../models/Student');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendMail } = require('../utils/mailer');

// Student submits registration request
exports.submitRegistration = async (req, res) => {
  try {
    const { name, email, password, section, year, rollNo, idNumber, phone } = req.body;
    // Check if a user or pending request already exists for this email
    const existingUser = await User.findOne({ email });
    // Allow re-registration if previous request is rejected
    const existingRequest = await StudentRegistrationRequest.findOne({ email, status: { $in: ['pending', 'approved'] } });
    if (existingUser) return res.status(400).json({ message: 'Email is already registered.' });
    if (existingRequest) return res.status(400).json({ message: 'A registration request is already pending or approved for this email.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const request = new StudentRegistrationRequest({ name, email, passwordHash, section, year, rollNo, idNumber, phone });
    await request.save();
    res.status(201).json({ message: 'Registration request submitted. Await admin approval.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: list all pending requests
exports.listPending = async (req, res) => {
  try {
    const requests = await StudentRegistrationRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: approve a request
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await StudentRegistrationRequest.findById(id);
    if (!request || request.status !== 'pending') return res.status(404).json({ message: 'Request not found or already processed.' });
    // Create user
    const user = new User({ name: request.name, email: request.email, passwordHash: request.passwordHash, role: 'student' });
    await user.save();
    // Create student profile
    const student = new Student({ userId: user._id, section: request.section, year: request.year, rollNo: request.rollNo, idNumber: request.idNumber, phone: request.phone });
    await student.save();
    // Update request
    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user.id;
    await request.save();
    // Send email notification
    try {
      await sendMail({
        to: request.email,
        subject: 'Registration Approved',
        text: `Dear ${request.name},\n\nYour registration has been approved. You can now log in using your email and password.`,
        html: `<p>Dear ${request.name},</p><p>Your registration has been <b>approved</b>. You can now log in using your email and password.</p>`
      });
    } catch (mailErr) {
      console.error('[EMAIL][APPROVE]', mailErr);
    }
    res.json({ message: 'Student approved and account created.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: reject a request
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    let { reason } = req.body;
    const request = await StudentRegistrationRequest.findById(id);
    if (!request || request.status !== 'pending') return res.status(404).json({ message: 'Request not found or already processed.' });
    request.status = 'rejected';
    // Enforce default reason if not provided
    request.rejectionReason = (typeof reason === 'string' && reason.trim()) ? reason : 'N/A';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user.id;
    await request.save();
    // Send email notification
    try {
      await sendMail({
        to: request.email,
        subject: 'Registration Rejected',
        text: `Dear ${request.name},\n\nYour registration has been rejected. Reason: ${request.rejectionReason}`,
        html: `<p>Dear ${request.name},</p><p>Your registration has been <b>rejected</b>.</p><p>Reason: ${request.rejectionReason}</p>`
      });
    } catch (mailErr) {
      console.error('[EMAIL][REJECT]', mailErr);
    }
    res.json({ message: 'Registration request rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a single registration request by ID
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await StudentRegistrationRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a registration request by ID
exports.updateRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = (({ name, email, section, year, rollNo, idNumber, phone }) => ({ name, email, section, year, rollNo, idNumber, phone }))(req.body);
    const request = await StudentRegistrationRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    // Only allow editing if pending
    if (request.status !== 'pending') return res.status(400).json({ message: 'Cannot edit a request that is not pending.' });
    Object.assign(request, updateFields);
    await request.save();
    res.json({ message: 'Request updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: check registration status by email
exports.checkStatus = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const request = await StudentRegistrationRequest.findOne({ email });
    if (!request) return res.status(404).json({ message: 'No registration request found for this email.' });
    res.json({ status: request.status, rejectionReason: request.rejectionReason || '', reviewedAt: request.reviewedAt });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
