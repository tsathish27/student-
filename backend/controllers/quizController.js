const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Student = require('../models/Student');

// Admin: Create a quiz
exports.createQuiz = async (req, res) => {
  try {
    const { title, subject, section, year, semester, questions, deadline } = req.body;
    const quiz = new Quiz({
      title,
      subject,
      section,
      year,
      semester,
      questions,
      createdBy: req.user.id,
      deadline
    });
    await quiz.save();
    res.status(201).json({ message: 'Quiz created', quiz });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Update a quiz
exports.updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, section, year, semester, questions, deadline, isActive } = req.body;
    const update = { title, subject, section, year, semester, questions, deadline };
    if (typeof isActive !== 'undefined') update.isActive = isActive;
    const quiz = await Quiz.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz updated', quiz });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Delete a quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndDelete(id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all quizzes for a section/year/semester/subject
exports.getQuizzes = async (req, res) => {
  try {
    const { section, year, semester, subject, isActive } = req.query;
    const filter = {};
    if (section) filter.section = section;
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const quizzes = await Quiz.find(filter);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Submit quiz attempt
exports.submitQuiz = async (req, res) => {
  try {
    const quizId = req.body.quizId || req.params.id;
    const { answers } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    quiz.questions.forEach((q, idx) => {
      const ans = answers.find(a => String(a.questionId) === String(q._id));
      if (ans && ans.selectedOption === q.correctOption) {
        score += q.marks;
        correctCount++;
      } else if (ans) {
        incorrectCount++;
      }
    });
    const totalMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    // Prevent duplicate attempts
    const studentId = req.user.studentId || req.user.id;
    const existingAttempt = await QuizAttempt.findOne({ quizId, studentId });
    if (existingAttempt) {
      return res.status(400).json({ message: 'You have already submitted this quiz.' });
    }
    const attempt = new QuizAttempt({
      quizId,
      studentId,
      answers,
      score,
      evaluated: true
    });
    await attempt.save();
    res.status(201).json({ 
      message: 'Quiz submitted', 
      score, 
      totalMarks, 
      correctCount, 
      incorrectCount,
      attemptId: attempt._id
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a student's quiz attempts
exports.getStudentAttempts = async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user.id;
    const { quizId } = req.query;
    const filter = { studentId };
    if (quizId) filter.quizId = quizId;
    const attempts = await QuizAttempt.find(filter);
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get available quizzes for the authenticated student
exports.getAvailableQuizzes = async (req, res) => {
  try {
    // Use studentId from params if present (admin), else from JWT (student)
    let studentId = req.params.studentId;
    if (!studentId || studentId === 'me') {
      studentId = req.user.studentId || req.user.id;
    }
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    // Normalize section, year, and semester for flexible matching
    function normalizeSection(section) {
      if (!section) return section;
      const match = section.match(/cse[-_ ]?(\d+)/i);
      if (match) {
        return `CSE-` + match[1].padStart(2, '0');
      }
      return section.toUpperCase();
    }
    function normalizeYear(year) {
      if (!year) return year;
      if (/^E-\d$/.test(year)) return 'E' + year[2]; // 'E-1' => 'E1'
      if (/^E\d$/.test(year)) return year;
      return year.toUpperCase();
    }
    function normalizeSemester(sem) {
      if (sem === 'sem1' || sem === '1') return 'sem1';
      if (sem === 'sem2' || sem === '2') return 'sem2';
      return sem;
    }
    let semesterList = [];
    if (!student.semester) {
      semesterList = ['sem1', 'sem2'];
      console.warn('[QUIZ][AVAILABLE] WARNING: Student semester is undefined, matching both "sem1" and "sem2" quizzes. Please fix the student document in MongoDB.');
    } else {
      const normalizedSemester = normalizeSemester(student.semester);
      semesterList = [student.semester, normalizedSemester];
    }
    const normalizedSection = normalizeSection(student.section);
    const normalizedYear = normalizeYear(student.year);
    // Log student and normalized values
    console.log('[QUIZ][AVAILABLE] Student:', {
      section: student.section,
      year: student.year,
      semester: student.semester
    });
    console.log('[QUIZ][AVAILABLE] Normalized:', {
      section: normalizedSection,
      year: normalizedYear,
      semesterList
    });
    // Find quizzes that match normalized values
    const quizFilter = {
      section: { $in: [student.section, normalizedSection] },
      year: { $in: [student.year, normalizedYear] },
      semester: { $in: semesterList },
      isActive: true
    };
    console.log('[QUIZ][AVAILABLE] Quiz filter:', quizFilter);
    const quizzes = await Quiz.find(quizFilter);
    console.log(`[QUIZ][AVAILABLE] Quizzes found: ${quizzes.length}`);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Get all quizzes for their section/year/semester/subject with status
exports.getAllQuizzesWithStatus = async (req, res) => {
  try {
    // Support both /:studentId and /me endpoints
    let studentId = req.params.studentId;
    if (!studentId || studentId === 'me') {
      studentId = req.user.studentId || req.user.id;
    }
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    const filter = {
      section: normalizeSection(student.section),
      year: normalizeYear(student.year)
    };
    const semester = normalizeSemester(student.semester);
    if (semester) filter.semester = semester;
    const quizzes = await Quiz.find(filter).lean();
    const attempts = await QuizAttempt.find({ studentId }).lean();
    const attemptMap = {};
    attempts.forEach(a => { attemptMap[String(a.quizId)] = a; });
    const now = new Date();
    const quizzesWithStatus = quizzes.map(q => {
      const attempt = attemptMap[String(q._id)];
      let status = 'Available';
      if (attempt) {
        status = 'Attempted';
      } else if (q.deadline && new Date(q.deadline) < now) {
        status = 'Missed';
      }
      return {
        ...q,
        status,
        attempt: attempt || null
      };
    });
    res.json(quizzesWithStatus);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Get quiz review data (questions + submitted answers + correctness)
exports.getQuizReview = async (req, res) => {
  try {
    const quizId = req.params.quizId || req.query.quizId;
    const studentId = req.user.studentId || req.user.id;
    const quiz = await Quiz.findById(quizId).lean();
    const attempt = await QuizAttempt.findOne({ quizId, studentId }).lean();
    if (!quiz || !attempt) return res.status(404).json({ message: 'Not found' });

    // Always use Quiz model for question text, options, and correct answer
    // Use QuizAttempt.answers for submitted answers
    const questions = quiz.questions.map(q => {
      const submitted = (attempt.answers || []).find(a => String(a.questionId) === String(q._id));
      const submittedOption = submitted ? submitted.selectedOption : null;
      return {
        questionId: q._id,
        questionText: q.questionText || q.text || '',
        options: q.options,
        correctOption: q.correctOption,
        correctOptionText: typeof q.options[q.correctOption] !== 'undefined' ? q.options[q.correctOption] : null,
        marks: q.marks || 1,
        submittedOption: submittedOption,
        submittedOptionText: submittedOption !== null && typeof q.options[submittedOption] !== 'undefined' ? q.options[submittedOption] : null,
        isCorrect: submittedOption !== null && submittedOption === q.correctOption
      };
    });

    res.json({
      quizId: quiz._id,
      title: quiz.title,
      questions,
      score: attempt.score,
      totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
      correctCount: questions.filter(q => q.isCorrect).length,
      incorrectCount: questions.filter(q => q.submittedOption !== null && !q.isCorrect).length
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Helpers
function normalizeYear(year) {
  if (typeof year === 'string') {
    // Accept 'E-1', 'E-2', 'E-3', 'E-4' or 'E1', 'E2', etc.
    if (/^E-\d$/.test(year)) return 'E' + year[2]; // 'E-1' => 'E1'
    if (/^E\d$/.test(year)) return year; // 'E1', 'E2', etc.
  }
  return year;
}

function normalizeSection(section) {
  // Ensure section is in format 'CSE-01', 'CSE-02', etc.
  if (!section) return section;
  const match = section.match(/cse[-_ ]?(\d+)/i);
  if (match) {
    return `CSE-${match[1].padStart(2, '0')}`;
  }
  return section;
}

function normalizeSemester(sem) {
  if (sem === 'sem1' || sem === '1') return 'sem1';
  if (sem === 'sem2' || sem === '2') return 'sem2';
  return sem;
}
