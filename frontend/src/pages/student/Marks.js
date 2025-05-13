import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function StudentMarks() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [assessmentType, setAssessmentType] = useState('');
  const [semester, setSemester] = useState('');
  const [studentYear, setStudentYear] = useState('');
  const [subjects, setSubjects] = useState([]);

  const SEMESTER_OPTIONS = [
    { value: 'sem1', label: 'Semester 1' },
    { value: 'sem2', label: 'Semester 2' }
  ];
  const semesterMapToBackend = { sem1: 'sem1', sem2: 'sem2', '1': 'sem1', '2': 'sem2' };
  const semesterMapToFrontend = { sem1: 'sem1', sem2: 'sem2', '1': 'sem1', '2': 'sem2' };
  const yearMap = { '1': 'E-1', '2': 'E-2', '3': 'E-3', '4': 'E-4', 'E-1': 'E-1', 'E-2': 'E-2', 'E-3': 'E-3', 'E-4': 'E-4' };

  useEffect(() => {
    if (!user || !user._id) return;
    setLoading(true);
    setError('');
    apiRequest('/student/my')
      .then(student => {
        if (!student || !student._id) throw new Error('Student profile not found');
        setStudentYear(student.year || '');
        return apiRequest(`/marks/${student._id}`);
      })
      .then(data => {
        const mapped = Array.isArray(data) ? data.map(m => ({
          ...m,
          semester: semesterMapToFrontend[m.semester] || m.semester
        })) : [];
        setMarks(mapped);
        setFiltered(mapped);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!studentYear || !semester) {
      setSubjects([]);
      setSubject('');
      return;
    }
    const backendYear = yearMap[studentYear] || studentYear;
    const backendSemester = semesterMapToBackend[semester] || semester;
    apiRequest(`/subject?year=${backendYear}&semester=${backendSemester === 'sem1' ? '1' : '2'}`)
      .then(data => {
        setSubjects(data);
        if (!data.some(s => s.name === subject)) setSubject('');
      })
      .catch(() => setSubjects([]));
  }, [studentYear, semester]);

  useEffect(() => {
    let f = marks;
    if (semester) f = f.filter(m => m.semester === semester);
    if (subject) f = f.filter(m => m.subject === subject);
    if (assessmentType) f = f.filter(m => m.assessmentType === assessmentType);
    setFiltered(f);
  }, [subject, assessmentType, semester, marks]);

  const total = filtered.reduce((sum, m) => sum + (m.score || 0), 0);
  const maxTotal = filtered.reduce((sum, m) => sum + (m.maxScore || 0), 0);
  const avg = filtered.length ? (total / filtered.length).toFixed(2) : 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold mb-4">My Marks</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={semester}
          onChange={e => {
            setSemester(e.target.value);
            setSubject('');
          }}
          className="border rounded px-3 py-1"
        >
          <option value="">Select Semester</option>
          {SEMESTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="border rounded px-3 py-1"
          disabled={!semester || subjects.length === 0}
        >
          <option value="">{semester ? 'All Subjects' : 'Select semester first'}</option>
          {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>

        <select value={assessmentType} onChange={e => setAssessmentType(e.target.value)} className="border rounded px-3 py-1">
          <option value="">All Assessment Types</option>
          <option value="AT 1">AT 1</option>
          <option value="AT 2">AT 2</option>
          <option value="AT 3">AT 3</option>
          <option value="AT 4">AT 4</option>
          <option value="MID 1">MID 1</option>
          <option value="MID 2">MID 2</option>
          <option value="MID 3">MID 3</option>
          <option value="Others">Others</option>
        </select>

        {(subject || assessmentType || semester) && (
          <button
            onClick={() => {
              setSubject('');
              setAssessmentType('');
              setSemester('');
            }}
            className="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          >
            Clear Filters
          </button>
        )}
      </div>

      {!semester && (
        <div className="mb-4 text-blue-700 font-medium">Please select a semester to filter by subject.</div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : filtered.length === 0 ? (
        <div>No marks found for selected filter.</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl shadow-lg bg-white">
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-center">Subject</th>
                  <th className="p-2 text-center">Assessment Type</th>
                  <th className="p-2 text-center">Score</th>
                  <th className="p-2 text-center">Max Score</th>
                  <th className="p-2 text-center">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m._id} className="border-t hover:bg-blue-50 transition-all">
                    <td className="p-2 text-center font-medium">{m.subject}</td>
                    <td className="p-2 text-center">{m.assessmentType}</td>
                    <td className={`p-2 text-center font-semibold ${m.score / m.maxScore >= 0.8 ? 'text-green-600' : m.score / m.maxScore < 0.5 ? 'text-red-600' : 'text-yellow-600'}`}>{m.score}</td>
                    <td className="p-2 text-center">{m.maxScore}</td>
                    <td className="p-2 text-center">{m.date ? new Date(m.date).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="p-2 text-center" colSpan={2}>Total / Average</td>
                  <td className="p-2 text-center">{total} / {avg}</td>
                  <td className="p-2 text-center">{maxTotal}</td>
                  <td className="p-2 text-center"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {filtered.map(m => (
              <div key={m._id} className="border rounded-lg shadow p-4 bg-white">
                <div className="font-semibold text-lg">{m.subject}</div>
                <div className="text-sm text-gray-600">{m.assessmentType}</div>
                <div className="mt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Score:</span>
                    <span className={`${m.score / m.maxScore >= 0.8 ? 'text-green-600' : m.score / m.maxScore < 0.5 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {m.score} / {m.maxScore}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="font-medium">Date:</span>
                    <span>{m.date ? new Date(m.date).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded shadow text-center font-semibold">
              Total Score: {total} / {maxTotal} | Average: {avg}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
