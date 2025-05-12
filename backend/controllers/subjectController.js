const Subject = require('../models/Subject');

// Create a new subject
exports.createSubject = async (req, res) => {
  try {
    const { name, code, year, semester } = req.body;
    if (!['E-1', 'E-2', 'E-3', 'E-4'].includes(year)) {
      return res.status(400).json({ message: 'Year must be E-1, E-2, E-3, or E-4' });
    }
    if (!['1', '2'].includes(semester)) {
      return res.status(400).json({ message: 'Semester must be 1 or 2' });
    }
    const subject = new Subject({ name, code, year, semester });
    await subject.save();
    res.status(201).json({ message: 'Subject created', subject });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update an existing subject
exports.updateSubject = async (req, res) => {
  try {
    const { name, code, year, semester } = req.body;
    if (!['E-1', 'E-2', 'E-3', 'E-4'].includes(year)) {
      return res.status(400).json({ message: 'Year must be E-1, E-2, E-3, or E-4' });
    }
    if (!['1', '2'].includes(semester)) {
      return res.status(400).json({ message: 'Semester must be 1 or 2' });
    }
    const updated = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, code, year, semester },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject updated', subject: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a subject
exports.deleteSubject = async (req, res) => {
  try {
    const deleted = await Subject.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all subjects (optionally filter by year, section, semester)
exports.getSubjects = async (req, res) => {
  try {
    const { year, semester } = req.query;
    const filter = {};
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    const subjects = await Subject.find(filter);
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
