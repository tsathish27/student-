const Report = require('../models/Report');
const Student = require('../models/Student');
const Marks = require('../models/Marks');
const Attendance = require('../models/Attendance');
const PDFDocument = require('pdfkit');

// Add a helper to extract studentId from either params or query for admin or student
function extractStudentId(req) {
  return req.params.studentId || req.query.studentId;
}

// Generate a report for a student (PDF, CSV, or XLSX)
exports.generateStudentReport = async (req, res) => {
  try {
    const { semester, reportType = 'Performance' } = req.query;
    const studentId = extractStudentId(req);
    const student = await Student.findById(studentId).populate('userId');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const marks = await Marks.find({ studentId, semester });
    const attendance = await Attendance.find({ studentId, semester });
    // Calculate attendance summary
    const presents = attendance.filter(a => a.status === 'Present').length;
    const total = attendance.length;
    const attendancePct = total > 0 ? (presents / total) * 100 : 0;
    // Quiz
    const QuizAttempt = require('../models/QuizAttempt');
    const Quiz = require('../models/Quiz');
    let quizAttempts = [];
    try { quizAttempts = await QuizAttempt.find({ studentId }); } catch { quizAttempts = []; }
    let quizData = [];
    try {
      quizData = await Promise.all(
        quizAttempts.map(async (attempt) => {
          try {
            const quiz = await Quiz.findById(attempt.quizId);
            if (!quiz) return null;
            if (quiz.semester !== semester) return null;
            return {
              quizTitle: quiz.title,
              subject: quiz.subject,
              score: attempt.score,
              submittedAt: attempt.submittedAt
            };
          } catch { return null; }
        })
      );
    } catch { quizData = []; }

    // --- Attendance Table ---
    function getAttendanceTable(attendance) {
      if (!attendance || attendance.length === 0) return [];
      const bySubject = {};
      attendance.forEach(a => {
        // Defensive: skip if subject is missing
        if (!a.subject) return;
        if (!bySubject[a.subject]) bySubject[a.subject] = { total: 0, presents: 0 };
        bySubject[a.subject].total++;
        if (a.status === 'Present') bySubject[a.subject].presents++;
      });
      return Object.entries(bySubject).map(([subject, data]) => ({
        subject,
        total: data.total,
        presents: data.presents,
        percent: data.total > 0 ? ((data.presents / data.total) * 100).toFixed(2) : '0.00'
      }));
    }

    // --- Marks Table ---
    function getMarksTable(marks) {
      return marks.map(m => ({
        subject: m.subject,
        assessmentType: m.assessmentType,
        assignmentName: m.assignmentName || '-',
        maxScore: m.maxScore,
        score: m.score,
        percent: m.maxScore > 0 ? ((m.score / m.maxScore) * 100).toFixed(2) : '0.00'
      }));
    }

    // --- Quiz Table ---
    function getQuizTable(quizData) {
      return quizData.filter(q => q).map(q => ({
        quizTitle: q.quizTitle,
        subject: q.subject,
        score: q.score,
        submittedAt: q.submittedAt ? new Date(q.submittedAt).toLocaleString() : '-'
      }));
    }
    const attendanceTable = getAttendanceTable(attendance);
    const marksTable = getMarksTable(marks);
    const quizTable = getQuizTable(quizData);

    // Only create a report if explicitly requested by the user (not for dashboard/stats)
    // Add a guard: only create if req.query.create === 'true' or method is POST
    if ((req.method === 'POST') || req.query.create === 'true') {
      await Report.create({
        studentId: student._id,
        type: reportType,
        generatedBy: req.user.id, // Ensure the report is linked to the user who generated it
        data: {
          name: student.userId.name,
          email: student.userId.email,
          idNumber: student.idNumber, 
          section: student.section,
          year: student.year,
          semester: semester,
          attendance: attendanceTable,
          marks: marksTable,
          quizzes: quizTable
        }
      });
    }

    // --- Excel ---
    if (req.query.format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Student Report');
      // Student Info
      sheet.addRow(['Name', student.userId.name]);
      sheet.addRow(['Email', student.userId.email]);
      sheet.addRow(['ID Number', student.idNumber]);
      sheet.addRow(['Section', student.section]);
      sheet.addRow(['Year', student.year]);
      sheet.addRow(['Semester', semester]);
      sheet.addRow([]);
      if (reportType === 'Attendance') {
        sheet.addRow(['Attendance Report']);
        sheet.addRow(['Subject', 'Total Classes', 'Presents', 'Attendance %']);
        if (attendanceTable.length === 0) {
          sheet.addRow(['No attendance records found', '-', '-', '-']);
        } else {
          attendanceTable.forEach(r => sheet.addRow([r.subject, r.total, r.presents, r.percent]));
        }
        sheet.addRow([]);
      }
      if (reportType === 'Marks') {
        sheet.addRow(['Marks Report']);
        sheet.addRow(['Subject', 'Assessment Type', 'Assignment Name', 'Max Marks', 'Marks Gained', 'Marks %']);
        marksTable.forEach(r => sheet.addRow([r.subject, r.assessmentType, r.assignmentName, r.maxScore, r.score, r.percent]));
        if (marksTable.length === 0) {
          sheet.addRow(['-', '-', '-', '-', '-', '-']);
        }
        sheet.addRow([]);
      }
      if (reportType === 'Performance' || reportType === 'Quiz' || reportType === 'All') {
        sheet.addRow(['Quiz Report']);
        sheet.addRow(['Quiz Title', 'Subject', 'Score', 'Submitted At']);
        quizTable.forEach(r => sheet.addRow([r.quizTitle, r.subject, r.score, r.submittedAt]));
        if (quizTable.length === 0) {
          sheet.addRow(['-', '-', '-', '-']);
        }
        sheet.addRow([]);
      }
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=student_report_${studentId}_${semester}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    }
    // --- CSV ---
    if (req.query.format === 'csv') {
      // Improved CSV: flatten nested objects/arrays for readability
      let csv = '';
      csv += `Name,"${student.userId.name}"
`;
      csv += `Email,"${student.userId.email}"
`;
      csv += `ID Number,"${student.idNumber}"
`;
      csv += `Section,"${student.section}"
`;
      csv += `Year,"${student.year}"
`;
      csv += `Semester,"${semester}"

`;
      if (reportType === 'Attendance') {
        csv += 'Attendance Report\nSubject,Total Classes,Presents,Attendance %\n';
        if (attendanceTable.length === 0) {
          csv += 'No attendance records found,-,-,-\n';
        } else {
          attendanceTable.forEach(r => csv += `${r.subject},${r.total},${r.presents},${r.percent}\n`);
        }
        csv += '\n';
      }
      if (reportType === 'Marks') {
        csv += 'Marks Report\nSubject,Assessment Type,Assignment Name,Max Marks,Marks Gained,Marks %\n';
        if (marksTable.length === 0) {
          csv += '-,-,-,-,-,-\n';
        } else {
          marksTable.forEach(r => csv += `${r.subject},${r.assessmentType},${r.assignmentName},${r.maxScore},${r.score},${r.percent}\n`);
        }
        csv += '\n';
      }
      if (reportType === 'Performance' || reportType === 'Quiz' || reportType === 'All') {
        csv += 'Quiz Report\nQuiz Title,Subject,Score,Submitted At\n';
        if (quizTable.length === 0) {
          csv += '-,-,-,-\n';
        } else {
          quizTable.forEach(r => csv += `${r.quizTitle},${r.subject},${r.score},${r.submittedAt}\n`);
        }
        csv += '\n';
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=student_report_${studentId}_${semester}.csv`);
      return res.send('\uFEFF'+csv);
    }
    // PDF feature removed
    return res.status(400).json({ message: 'PDF format is not supported. Please use Excel or CSV.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Generate a class-wise report for a section/year/semester
exports.generateClassReport = async (req, res) => {
  try {
    const { section, year, semester, format = 'xlsx' } = req.query;
    if (!section || !year || !semester) {
      return res.status(400).json({ message: 'Missing section, year, or semester' });
    }
    const Student = require('../models/Student');
    const Marks = require('../models/Marks');
    const Attendance = require('../models/Attendance');
    const QuizAttempt = require('../models/QuizAttempt');
    const Quiz = require('../models/Quiz');
    const students = await Student.find({ section, year }).populate('userId');
    let reportRows = [];
    for (const student of students) {
      const marks = await Marks.find({ studentId: student._id, semester });
      const attendance = await Attendance.find({ studentId: student._id, semester });
      const presents = attendance.filter(a => a.status === 'Present').length;
      const total = attendance.length;
      const attendancePct = total > 0 ? (presents / total) * 100 : 0;
      let quizAttempts = [];
      try { quizAttempts = await QuizAttempt.find({ studentId: student._id }); } catch { quizAttempts = []; }
      let quizData = [];
      try {
        quizData = await Promise.all(
          quizAttempts.map(async (attempt) => {
            try {
              const quiz = await Quiz.findById(attempt.quizId);
              if (!quiz) return null;
              if (quiz.semester !== semester) return null;
              return {
                quizTitle: quiz.title,
                subject: quiz.subject,
                score: attempt.score,
                submittedAt: attempt.submittedAt
              };
            } catch { return null; }
          })
        );
      } catch { quizData = []; }
      reportRows.push({
        studentId: student._id,
        name: student.userId?.name || '',
        email: student.userId?.email || '',
        idNumber: student.idNumber || '-', 
        section: student.section,
        year: student.year,
        semester: semester,
        attendance: { presents, total, percent: attendancePct },
        marks: marks.length > 0 ? marks.map(m => ({
          subject: m.subject,
          assessmentType: m.assessmentType,
          score: m.score,
          maxScore: m.maxScore
        })) : [{ subject: null, assessmentType: null, score: 0, maxScore: 0 }],
        quizzes: quizData && quizData.filter(q => q).length > 0 ? quizData.filter(q => q) : [{ quizTitle: null, subject: null, score: 0, submittedAt: null }]
      });
    }
    // If no students, generate a single empty row
    if (reportRows.length === 0) {
      reportRows.push({
        studentId: null,
        name: null,
        email: null,
        idNumber: null,
        section: null,
        year: null,
        semester: semester,
        attendance: { presents: 0, total: 0, percent: 0 },
        marks: [{ subject: null, assessmentType: null, score: 0, maxScore: 0 }],
        quizzes: [{ quizTitle: null, subject: null, score: 0, submittedAt: null }]
      });
    }
    // Determine report type based on query or default to 'All'
    let reportType = req.query.reportType;
    if (!['Attendance','Marks','Performance','All'].includes(reportType)) reportType = 'All';
    // Save class report summary in DB
    const Report = require('../models/Report');
    await Report.create({
      type: reportType,
      data: { section, year, semester, students: reportRows },
      generatedBy: req.user.id
    });
    // Generate file for download
    if (format === 'xlsx') {
      // Generate real Excel file
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Class Report');
      // Build columns based on reportType
      let columns = [];
      if (reportType === 'Marks') {
        columns = [
          { header: 'Name', key: 'name', width: 24 },
          { header: 'Email', key: 'email', width: 32 },
          { header: 'ID Number', key: 'idNumber', width: 16 },
          { header: 'Subject', key: 'subject', width: 18 },
          { header: 'Assessment Type', key: 'assessmentType', width: 18 },
          { header: 'Marks (Gained/Max)', key: 'marks', width: 18 },
          { header: 'Marks %', key: 'percent', width: 12 }
        ];
        sheet.columns = columns;
        for (const row of reportRows) {
          if (Array.isArray(row.marks)) {
            row.marks.forEach(m => {
              sheet.addRow({
                name: row.name || '-',
                email: row.email || '-',
                idNumber: row.idNumber || '-',
                subject: m.subject || '-',
                assessmentType: m.assessmentType || '-',
                marks: `${m.score||0}/${m.maxScore||0}`,
                percent: m.maxScore > 0 ? ((m.score / m.maxScore) * 100).toFixed(2) : '0.00'
              });
            });
          }
        }
      } else if (reportType === 'Attendance') {
        columns = [
          { header: 'Name', key: 'name', width: 24 },
          { header: 'Email', key: 'email', width: 32 },
          { header: 'ID Number', key: 'idNumber', width: 16 },
          { header: 'Semester', key: 'semester', width: 12 },
          { header: 'Subject', key: 'subject', width: 18 },
          { header: 'Classes Conducted', key: 'total', width: 16 },
          { header: 'Classes Attended', key: 'presents', width: 16 },
          { header: 'Attendance %', key: 'percent', width: 12 }
        ];
        sheet.columns = columns;
        for (const row of reportRows) {
          if (Array.isArray(row.attendance)) {
            row.attendance.forEach(a => {
              sheet.addRow({
                name: row.name || '-',
                email: row.email || '-',
                idNumber: row.idNumber || '-',
                semester: semester,
                subject: a.subject || '-',
                total: a.total || 0,
                presents: a.presents || 0,
                percent: a.percent || '0.00'
              });
            });
          }
        }
      } else { // Performance/All
        columns = [
          { header: 'Name', key: 'name', width: 24 },
          { header: 'Email', key: 'email', width: 32 },
          { header: 'ID Number', key: 'idNumber', width: 16 },
          { header: 'Semester', key: 'semester', width: 12 },
          { header: 'Subject', key: 'subject', width: 18 },
          { header: 'Assessment Type', key: 'assessmentType', width: 18 },
          { header: 'Marks (Gained/Max)', key: 'marks', width: 18 },
          { header: 'Marks %', key: 'percent', width: 12 },
          { header: 'Quiz Title', key: 'quizTitle', width: 18 },
          { header: 'Quiz Subject', key: 'quizSubject', width: 18 },
          { header: 'Quiz Score', key: 'quizScore', width: 12 },
          { header: 'Quiz Submitted At', key: 'quizSubmittedAt', width: 22 },
          { header: 'Classes Conducted', key: 'total', width: 16 },
          { header: 'Classes Attended', key: 'presents', width: 16 },
          { header: 'Attendance %', key: 'attendancePercent', width: 12 }
        ];
        sheet.columns = columns;
        for (const row of reportRows) {
          const maxLen = Math.max(
            row.attendance && Array.isArray(row.attendance) ? row.attendance.length : 0,
            row.marks && Array.isArray(row.marks) ? row.marks.length : 0,
            row.quizzes && Array.isArray(row.quizzes) ? row.quizzes.length : 0,
            1
          );
          for (let i = 0; i < maxLen; i++) {
            const a = row.attendance && row.attendance[i] ? row.attendance[i] : {};
            const m = row.marks && row.marks[i] ? row.marks[i] : {};
            const q = row.quizzes && row.quizzes[i] ? row.quizzes[i] : {};
            sheet.addRow({
              name: row.name || '-',
              email: row.email || '-',
              idNumber: row.idNumber || '-',
              semester: row.semester || '-',
              subject: m.subject || a.subject || q.subject || '-',
              assessmentType: m.assessmentType || '-',
              marks: m.score !== undefined && m.maxScore !== undefined ? `${m.score}/${m.maxScore}` : '-',
              percent: m.maxScore > 0 ? ((m.score / m.maxScore) * 100).toFixed(2) : '-',
              quizTitle: q.quizTitle || '-',
              quizSubject: q.subject || '-',
              quizScore: q.score || '-',
              quizSubmittedAt: q.submittedAt || '-',
              total: a.total || '-',
              presents: a.presents || '-',
              attendancePercent: a.percent || '-'
            });
          }
        }
      }
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=class_report_${section}_${year}_${semester}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    }
    if (format === 'csv') {
      // CSV logic remains
      let csv = '\uFEFFName,Email,Attendance,Marks,Quizzes\n';
      for (const row of reportRows) {
        csv += `"${row.name||''}","${row.email||''}","${row.attendance ? `${row.attendance.presents}/${row.attendance.total} (${row.attendance.percent?.toFixed(2) || 0}%)` : '-'}","${Array.isArray(row.marks) && row.marks.length > 0 && row.marks[0].subject ? row.marks.map(m => `${m.subject||''} (${m.assessmentType||''}): ${m.score||0}/${m.maxScore||0}`).join('; ') : '-'}","${Array.isArray(row.quizzes) && row.quizzes.length > 0 && row.quizzes[0].quizTitle ? row.quizzes.map(q => `${q.quizTitle||''} (${q.subject||''}) - Score: ${q.score||0}${q.submittedAt ? ' at ' + new Date(q.submittedAt).toLocaleString() : ''}`).join('; ') : '-'}"\n`;
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=class_report_${section}_${year}_${semester}.csv`);
      return res.send(csv);
    } else {
      // PDF feature removed
      return res.status(400).json({ message: 'PDF format is not supported. Please use Excel or CSV.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all reports (admin)
exports.getAllReports = async (req, res) => {
  try {
    let reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a report by ID
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Report.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Report not found' });
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Bulk delete reports by IDs
exports.bulkDeleteReports = async (req, res) => {
  try {
    console.log('[bulkDeleteReports] req.body:', req.body);
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No report IDs provided.' });
    }
    const result = await Report.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error('[bulkDeleteReports] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
};

// Download a report (PDF or CSV)
exports.downloadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;
    let report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (format === 'csv') {
      // Improved CSV: flatten nested objects/arrays for readability
      let csv = '';
      if (report.type === 'class' && Array.isArray(report.data.students)) {
        // Class report: header
        csv += 'Name,Email,ID Number,Section,Year,Semester,Subject,Assessment Type,Assignment Name,Max Marks,Marks,Marks %,Attendance Subject,Total Classes,Presents,Attendance %,Quiz Title,Quiz Subject,Quiz Score,Quiz Submitted At\n';
        for (const row of report.data.students) {
          // For each student, generate a row for each marks/attendance/quiz
          const marksArr = Array.isArray(row.marks) ? row.marks : [];
          const attendanceArr = Array.isArray(row.attendance) ? row.attendance : [];
          const quizzesArr = Array.isArray(row.quizzes) ? row.quizzes : [];
          const maxRows = Math.max(1, marksArr.length, attendanceArr.length, quizzesArr.length);
          for (let i = 0; i < maxRows; i++) {
            const m = marksArr[i] || {};
            const a = attendanceArr[i] || {};
            const q = quizzesArr[i] || {};
            csv += `"${row.name||''}","${row.email||''}","${row.idNumber||''}","${row.section||''}","${row.year||''}","${row.semester||''}",` +
              `"${m.subject||''}","${m.assessmentType||''}","${m.assignmentName||''}","${m.maxScore||''}","${m.score||''}","${m.percent||''}",` +
              `"${a.subject||''}","${a.total||''}","${a.presents||''}","${a.percent||''}",` +
              `"${q.quizTitle||''}","${q.subject||''}","${q.score||''}","${q.submittedAt||''}"\n`;

          }
        }
      } else {
        // Individual report: expand attendance, marks, quizzes as separate tables
        const data = report.data || {};
        csv += 'Name,Email,ID Number,Section,Year,Semester\n';
        csv += `"${data.name||''}","${data.email||''}","${data.idNumber||''}","${data.section||''}","${data.year||''}","${data.semester||''}"\n\n`;
        if (Array.isArray(data.attendance) && data.attendance.length) {
          csv += 'Attendance Report\nSubject,Total Classes,Presents,Attendance %\n';
          data.attendance.forEach(r => {
            csv += `"${r.subject||''}","${r.total||''}","${r.presents||''}","${r.percent||''}"\n`;
          });
          csv += '\n';
        }
        if (Array.isArray(data.marks) && data.marks.length) {
          csv += 'Marks Report\nSubject,Assessment Type,Assignment Name,Max Marks,Marks,Marks %\n';
          data.marks.forEach(r => {
            csv += `"${r.subject||''}","${r.assessmentType||''}","${r.assignmentName||''}","${r.maxScore||''}","${r.score||''}","${r.percent||''}"\n`;
          });
          csv += '\n';
        }
        if (Array.isArray(data.quizzes) && data.quizzes.length) {
          csv += 'Quiz Report\nQuiz Title,Quiz Subject,Quiz Score,Quiz Submitted At\n';
          data.quizzes.forEach(r => {
            csv += `"${r.quizTitle||''}","${r.subject||''}","${r.score||''}","${r.submittedAt||''}"\n`;
          });
        }
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=report_${id}.csv`);
      return res.send('\uFEFF'+csv);
    }
    // XLSX (Excel) download support
    if (format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Report');
      if (report.type === 'class' && Array.isArray(report.data.students)) {
        // CLASS REPORT: One row per student, summarize marks/quizzes/attendance
        sheet.columns = [
          { header: 'Name', key: 'name', width: 24 },
          { header: 'Email', key: 'email', width: 32 },
          { header: 'ID Number', key: 'idNumber', width: 16 },
          { header: 'Semester', key: 'semester', width: 12 },
          { header: 'Subjects', key: 'subjects', width: 18 },
          { header: 'Marks', key: 'marks', width: 40 },
          { header: 'Quizzes', key: 'quizzes', width: 40 },
          { header: 'Attendance', key: 'attendance', width: 24 }
        ];
        const semester = report.data.semester || '-';
        for (const row of report.data.students) {
          // Summarize subjects
          let subjects = '-';
          if (Array.isArray(row.attendance)) {
            subjects = row.attendance.map(a => a.subject).join('; ');
          }
          // Summarize marks
          let marks = '-';
          if (Array.isArray(row.marks) && row.marks.length > 0) {
            marks = row.marks.map(m => `${m.subject||''} (${m.assessmentType||''}): ${m.score||0}/${m.maxScore||0}`).join('; ');
          }
          // Summarize quizzes
          let quizzes = '-';
          if (Array.isArray(row.quizzes) && row.quizzes.length > 0) {
            quizzes = row.quizzes.map(q => `${q.quizTitle||''} (${q.subject||''}) - Score: ${q.score||0}${q.submittedAt ? ' at ' + new Date(q.submittedAt).toLocaleString() : ''}`).join('; ');
          }
          // Summarize attendance
          let attendance = '-';
          if (Array.isArray(row.attendance) && row.attendance.length > 0) {
            attendance = row.attendance.map(a => `${a.subject||''}: ${a.presents||0}/${a.total||0} (${a.percent||'0.00'}%)`).join('; ');
          }
          sheet.addRow({
            name: row.name || '-',
            email: row.email || '-',
            idNumber: row.idNumber || '-',
            semester: semester,
            subjects: subjects,
            marks: marks,
            quizzes: quizzes,
            attendance: attendance
          });
        }
      } else {
        // Individual/group report: if students is an array of objects, expand each student as a row
        const data = report.data || {};
        if (Array.isArray(data.students) && data.students.length > 0 && typeof data.students[0] === 'object') {
          // Parent keys (except students)
          const parentKeys = Object.keys(data).filter(k => k !== 'students');
          // Student keys (from first student)
          const studentKeys = Object.keys(data.students[0]);
          // Sheet columns: parent fields + student fields
          sheet.columns = [
            ...parentKeys.map(k => ({ header: k, key: k, width: 20 })),
            ...studentKeys.map(k => ({ header: k, key: k, width: 20 }))
          ];
          // Add a row for each student
          data.students.forEach(student => {
            const row = {};
            parentKeys.forEach(k => row[k] = data[k]);
            studentKeys.forEach(k => row[k] = student[k]);
            sheet.addRow(row);
          });
        } else {
          // Fallback: output as table with headings in first row and values in second row
          const keys = Object.keys(data);
          sheet.columns = keys.map(k => ({ header: k, key: k, width: 24 }));
          const row = {};
          for (const k of keys) {
            row[k] = formatValue(data[k]);
          }
          sheet.addRow(keys);
          sheet.addRow(Object.values(row));
        }
      }
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=report_${id}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    }
    // PDF feature removed
    return res.status(400).json({ message: 'PDF format is not supported. Please use Excel or CSV.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get reports for the authenticated student
exports.getMyReports = async (req, res) => {
  try {
    // Prefer studentId from token, fallback to user id
    const studentId = req.user.studentId || req.user.id;
    if (!studentId) return res.status(400).json({ message: 'No studentId found in token.' });
    const reports = await Report.find({ studentId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get reports generated BY the authenticated student
exports.getReportsGeneratedByMe = async (req, res) => {
  try {
    const userId = req.user.id;
    // Only fetch reports where generatedBy matches the logged-in user
    const reports = await Report.find({ generatedBy: userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Delete a report by ID (only if owned/generated by them)
exports.deleteMyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    // Only allow deleting if the report was generated by this user
    const report = await Report.findOne({ _id: id, generatedBy: userId });
    if (!report) return res.status(404).json({ message: 'Report not found or not authorized' });
    await report.deleteOne();
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Bulk delete reports by IDs (only if owned/generated by them)
exports.bulkDeleteMyReports = async (req, res) => {
  try {
    let ids = req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No report IDs provided' });
    const userId = req.user.id;
    // Only delete reports generated by this user
    const result = await Report.deleteMany({ _id: { $in: ids }, generatedBy: userId });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Helper to format values for export
function formatValue(val) {
  if (Array.isArray(val)) {
    if (val.length > 0 && typeof val[0] === 'object') {
      // Array of objects
      return val.map(item => Object.entries(item).map(([kk, vv]) => kk+':'+vv).join('; ')).join(' | ');
    } else {
      // Array of primitives
      return val.join(', ');
    }
  } else if (typeof val === 'object' && val !== null) {
    return Object.entries(val).map(([kk, vv]) => kk+':'+vv).join('; ');
  } else {
    return val;
  }
}
