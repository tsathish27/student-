const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');

// Get attendance by filter (admin view)
exports.getAttendanceByFilter = async (req, res) => {
  try {
    const { date, section, year, semester, subject } = req.query;
    const filter = {};
    if (date) {
      // Accept both ISO string (YYYY-MM-DD) and Date
      let normalizedDate;
      if (typeof date === 'string' && date.length === 10) {
        // 'YYYY-MM-DD' from frontend, treat as UTC midnight
        normalizedDate = new Date(date + 'T00:00:00.000Z');
      } else {
        normalizedDate = new Date(date);
      }
      normalizedDate.setUTCHours(0, 0, 0, 0);
      // Query for records on this exact UTC day
      const nextDay = new Date(normalizedDate);
      nextDay.setUTCDate(normalizedDate.getUTCDate() + 1);
      filter.date = { $gte: normalizedDate, $lt: nextDay };
    }
    if (section) filter.section = section;
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;

    const records = await Attendance.find(filter).populate('studentId', 'name idNumber');
    res.json(records); // Return array directly for frontend compatibility
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Mark attendance for students (bulk or single), ensuring no duplicates for the same student/subject/date
function normalizeDate(dateStr) {
  // Always store as midnight UTC
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

exports.markAttendance = async (req, res) => {
  try {
    let { studentId, date, status, section, year, semester, subject, records } = req.body;
    if (!['sem1', 'sem2', '1', '2'].includes(semester)) {
      return res.status(400).json({ message: 'Semester must be sem1, sem2, 1, or 2' });
    }
    if (!date || !subject) {
      return res.status(400).json({ message: 'Date and subject are required.' });
    }
    // Validate subject exists for year+semester
    const semesterVal = semester === 'sem1' ? '1' : semester === 'sem2' ? '2' : semester;
    const validSubject = await Subject.findOne({ name: subject, year, semester: semesterVal });
    if (!validSubject) {
      return res.status(400).json({ message: `Subject '${subject}' not found for year ${year} and semester ${semesterVal}` });
    }
    const normalizedDate = normalizeDate(date);
    // Prevent marking attendance for future dates
    if (normalizedDate > new Date()) {
      return res.status(400).json({ message: 'Cannot mark attendance for future dates.' });
    }
    // Bulk insert or single
    let inserted = [];
    if (Array.isArray(records)) {
      for (const rec of records) {
        if (!rec.studentId || !rec.status) continue;
        // Prevent duplicate: if already exists with same status, skip
        const existing = await Attendance.findOne({ studentId: rec.studentId, date: normalizedDate, subject, section, year, semester });
        if (existing) {
          if (existing.status === rec.status) {
            // If status is unchanged, skip
            continue;
          }
          existing.status = rec.status;
          await existing.save();
          inserted.push(existing);
        } else {
          const result = await Attendance.create({ studentId: rec.studentId, date: normalizedDate, status: rec.status, section, year, semester, subject });
          inserted.push(result);
        }
        // Send notification for each student
        await Notification.create({
          userId: rec.studentId,
          message: `Attendance marked as '${rec.status}' for ${subject} on ${date}.`,
          type: rec.status === 'Present' ? 'success' : 'warning',
          target: 'all',
          year,
          section
        });
      }
    } else if (studentId && status) {
      const existing = await Attendance.findOne({ studentId, date: normalizedDate, subject, section, year, semester });
      if (existing) {
        if (existing.status === status) {
          return res.status(409).json({ message: 'Attendance already marked with this status.' });
        }
        existing.status = status;
        await existing.save();
        inserted.push(existing);
      } else {
        const result = await Attendance.create({ studentId, date: normalizedDate, status, section, year, semester, subject });
        inserted.push(result);
      }
      await Notification.create({
        userId: studentId,
        message: `Attendance marked as '${status}' for ${subject} on ${date}.`,
        type: status === 'Present' ? 'success' : 'warning',
        target: 'all',
        year,
        section
      });
    }
    res.json({ success: true, inserted });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get attendance summary for a student per semester (with subject/date filter)
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, subject, date } = req.query;
    const filter = { studentId };
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;
    if (date) filter.date = new Date(date);
    let records = [];
    try {
      records = await Attendance.find(filter);
    } catch (findErr) {
      // Defensive: always return an array
      records = [];
    }
    const presents = records.filter(r => r.status === 'Present').length;
    const total = records.length;
    const percentage = total > 0 ? (presents / total) * 100 : 0;
    // Return all records (Present and Absent)
    res.json({ presents, total, percentage, records });
  } catch (err) {
    // Log the error for debugging
    console.error('getStudentAttendance error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get attendance summary for the authenticated student (with subject/date filter)
exports.getMyAttendance = async (req, res) => {
  try {
    const { semester, subject, date } = req.query;
    // Only use studentId from JWT, never fallback to user id
    const studentId = req.user.studentId;
    if (!studentId) return res.status(400).json({ message: 'Missing studentId in token. Please log in again.' });
    if (!semester || !subject) return res.status(400).json({ message: 'Semester and subject are required.' });
    let filter = {};
    // Ensure studentId is ObjectId for query
    try {
      filter.studentId = new mongoose.Types.ObjectId(studentId);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid studentId format.' });
    }
    filter.semester = semester;
    filter.subject = subject;
    if (date) filter.date = new Date(date);
    console.log('Attendance filter:', filter);
    let records = [];
    try {
      records = await Attendance.find(filter);
      console.log('Attendance records found:', records);
    } catch (findErr) {
      records = [];
      console.log('Attendance query error:', findErr);
    }
    // Count increment: how many attendance records for this student?
    const attendanceCount = records.length;
    const presents = records.filter(r => r.status === 'Present').length;
    const total = records.length;
    const percentage = total > 0 ? (presents / total) * 100 : 0;
    // Return all records (Present and Absent)
    res.json({ presents, total, percentage, records, attendanceCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /attendance/my/summary?semester=sem1 - Student: All subject attendance for a semester
exports.getMyAttendanceSummary = async (req, res) => {
  try {
    const { semester } = req.query;
    const studentId = req.user.studentId;
    if (!studentId) return res.status(400).json({ message: 'Missing studentId in token. Please log in again.' });
    if (!semester) return res.status(400).json({ message: 'Semester is required.' });
    let filter = {};
    try {
      filter.studentId = new mongoose.Types.ObjectId(studentId);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid studentId format.' });
    }
    filter.semester = semester;
    // Find all subjects for this year/semester
    const student = await require('../models/Student').findById(studentId);
    const year = student.year;
    const subjects = await require('../models/Subject').find({ year, semester: semester === 'sem1' ? '1' : '2' });
    // Get all attendance records for this student and semester
    const records = await Attendance.find(filter);
    // Group by subject, count present/absent, and show 0 if not marked
    const summary = subjects.map(subject => {
      const subjectRecords = records.filter(r => r.subject === subject.name);
      const total = subjectRecords.length;
      const presents = subjectRecords.filter(r => r.status === 'Present').length;
      const absents = subjectRecords.filter(r => r.status === 'Absent').length;
      return {
        subject: subject.name,
        total,
        presents,
        absents,
        percentage: total > 0 ? (presents / total) * 100 : 0
      };
    });
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /attendance/:studentId/summary?semester=sem1 - Admin/Student: All subject attendance for a specific student and semester
exports.getStudentAttendanceSummary = async (req, res) => {
  try {
    const { semester } = req.query;
    const { studentId } = req.params;
    if (!studentId || typeof studentId !== 'string' || !/^[a-f\d]{24}$/i.test(studentId)) {
      return res.status(400).json({ message: 'Invalid or missing studentId in request.' });
    }
    if (!semester) return res.status(400).json({ message: 'Semester is required.' });
    let filter = {};
    filter.studentId = new mongoose.Types.ObjectId(studentId);
    filter.semester = semester;

    // Debug logging
    console.log('[getStudentAttendanceSummary] studentId:', studentId, 'semester:', semester);
    console.log('[getStudentAttendanceSummary] filter:', filter);

    // Group by subject and summarize, and populate student and user
    const records = await Attendance.find(filter)
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          model: 'User'
        }
      });
    console.log('[getStudentAttendanceSummary] records:', records);
    const summary = {};
    for (const rec of records) {
      if (!rec.subject) {
        console.log('[getStudentAttendanceSummary] Record missing subject:', rec);
        continue;
      }
      if (!summary[rec.subject]) summary[rec.subject] = { total: 0, presents: 0, student: rec.studentId, user: rec.studentId && rec.studentId.userId };
      summary[rec.subject].total++;
      if (rec.status === 'Present') summary[rec.subject].presents++;
    }
    // Format summary
    const result = Object.entries(summary).map(([subject, stats]) => ({
      subject,
      total: stats.total,
      presents: stats.presents,
      percentage: stats.total > 0 ? (stats.presents / stats.total) * 100 : 0,
      student: stats.student,
      user: stats.user
    }));
    res.json({ summary: result });
  } catch (err) {
    console.error('[getStudentAttendanceSummary] ERROR:', err);
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
};

// Update a single attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const update = req.body;
    const updated = await Attendance.findByIdAndUpdate(attendanceId, update, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }
    // Send notification to student
    await Notification.create({
      userId: updated.studentId,
      message: `Attendance updated to '${update.status}' for ${updated.subject} on ${updated.date.toISOString().slice(0,10)}.`,
      type: update.status === 'Present' ? 'success' : 'warning',
      target: 'all',
      year: updated.year,
      section: updated.section
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a single attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const deleted = await Attendance.findByIdAndDelete(attendanceId);
    if (!deleted) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }
    // Send notification to student
    await Notification.create({
      userId: deleted.studentId,
      message: `Attendance record for ${deleted.subject} on ${deleted.date.toISOString().slice(0,10)} has been deleted.`,
      type: 'warning',
      target: 'all',
      year: deleted.year,
      section: deleted.section
    });
    res.json({ message: 'Attendance record deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};