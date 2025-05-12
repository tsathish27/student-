const Marks = require('../models/Marks');
const Student = require('../models/Student');

// Create new marks entry
exports.createMarks = async (req, res) => {
  try {
    const { studentId, subject, assessmentType, score, maxScore, date, semester, year, section } = req.body;
    const validAssessmentTypes = ['AT 1','AT 2','AT 3','AT 4','MID 1','MID 2','MID 3','Others'];
    if (!validAssessmentTypes.includes(assessmentType)) {
      return res.status(400).json({ message: `assessmentType must be one of: ${validAssessmentTypes.join(', ')}` });
    }
    if (!['sem1', 'sem2'].includes(semester)) {
      return res.status(400).json({ message: 'Semester must be sem1 or sem2' });
    }
    // Check for existing marks with same keys
    const existing = await Marks.findOne({
      studentId,
      subject,
      assessmentType,
      semester
    });
    if (existing) {
      // Update the existing entry
      existing.score = score;
      existing.maxScore = maxScore;
      existing.date = date;
      await existing.save();
      return res.status(200).json({ message: 'Warning: Existing marks updated for this student, subject, assessment, year, section, and semester.', marks: existing, warning: true });
    }
    const marks = new Marks({ studentId, subject, assessmentType, score, maxScore, date, semester });
    await marks.save();
    res.status(201).json({ message: 'Marks added successfully', marks });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get marks for a student (optionally filter by semester)
exports.getStudentMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query;
    const filter = { studentId };
    if (semester) {
      filter.semester = semester;
    }
    const marks = await Marks.find(filter);
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get marks for the authenticated student
exports.getMyMarks = async (req, res) => {
  try {
    // Debug log for user context
    console.log('getMyMarks req.user:', req.user);
    const { semester } = req.query;
    // Try to use studentId from user, fallback to user id
    const studentId = req.user && (req.user.studentId || req.user.id);
    if (!studentId) {
      return res.status(400).json({ message: 'No studentId found in user context.' });
    }
    const filter = { studentId };
    if (semester) {
      filter.semester = semester;
    }
    const marks = await Marks.find(filter);
    res.json(marks);
  } catch (err) {
    console.error('getMyMarks error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get marks for a section with filters (Admin only)
exports.getSectionMarks = async (req, res) => {
  try {
    const { section, year, semester, subject, assessmentType } = req.query;
    if (!section || !year || !semester) {
      return res.status(400).json({ message: 'Missing section, year, or semester' });
    }
    // Find students in the section/year
    const students = await Student.find({ section, year });
    const studentIds = students.map(s => s._id);
    // Build marks filter
    const filter = { studentId: { $in: studentIds }, semester };
    if (subject) filter.subject = subject;
    if (assessmentType) filter.assessmentType = assessmentType;
    // NESTED POPULATE: studentId and studentId.userId (for name)
    const marks = await Marks.find(filter)
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name' }
      });
    // Sort by student roll number (ascending)
    marks.sort((a, b) => {
      const rollA = a.studentId?.rollNo || '';
      const rollB = b.studentId?.rollNo || '';
      return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
    });
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update marks by ID (Admin only)
exports.updateMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, maxScore, subject, assessmentType, semester } = req.body;
    const validAssessmentTypes = ['AT 1','AT 2','AT 3','AT 4','MID 1','MID 2','MID 3','Others'];
    if (assessmentType && !validAssessmentTypes.includes(assessmentType)) {
      return res.status(400).json({ message: `assessmentType must be one of: ${validAssessmentTypes.join(', ')}` });
    }
    const marks = await Marks.findById(id);
    if (!marks) {
      return res.status(404).json({ message: 'Marks not found' });
    }
    if (score !== undefined) marks.score = score;
    if (maxScore !== undefined) marks.maxScore = maxScore;
    if (subject) marks.subject = subject;
    if (assessmentType) marks.assessmentType = assessmentType;
    if (semester) marks.semester = semester;
    await marks.save();
    res.json({ message: 'Marks updated successfully', marks });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Bulk delete marks by IDs (Admin only)
exports.bulkDeleteMarks = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No mark IDs provided for bulk deletion.' });
    }
    const result = await Marks.deleteMany({ _id: { $in: ids } });
    res.json({ message: `Deleted ${result.deletedCount} marks successfully.`, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete marks by ID (Admin only)
exports.deleteMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const marks = await Marks.findByIdAndDelete(id);
    if (!marks) {
      return res.status(404).json({ message: 'Marks not found' });
    }
    res.json({ message: 'Marks deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
