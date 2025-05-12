import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { EditIcon, TrashIcon } from './_Icon';
import MarksBulkImport from './MarksBulkImport';

export default function MarksManage() {
  // Handler to refresh section marks after bulk import
  const handleBulkImportSuccess = () => {
    // Optionally refresh section marks or show a message
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Marks data refreshed after bulk import.', type: 'info' } }));
    }
    // You can also trigger a state update or data fetch here if needed
  }
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [assessmentType, setAssessmentType] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [msg, setMsg] = useState('');
  const [warning, setWarning] = useState('');

  // --- Section Marks Management ---
  const [filterSection, setFilterSection] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSubjects, setFilterSubjects] = useState([]);
  const [filterAssessmentType, setFilterAssessmentType] = useState('');
  const [sectionMarks, setSectionMarks] = useState([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [editRowId, setEditRowId] = useState(null);
  const [editScore, setEditScore] = useState('');
  const [editMaxScore, setEditMaxScore] = useState('');
  const [marksTableError, setMarksTableError] = useState('');
  const [selectedMarkIds, setSelectedMarkIds] = useState([]);
  const [allSelected, setAllSelected] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = [];
      if (section) params.push(`section=${section}`);
      if (year) params.push(`year=${year}`);
      const res = await apiRequest(`/student${params.length ? '?' + params.join('&') : ''}`);
      // Sort students by roll number (ascending)
      res.sort((a, b) => {
        const rollA = a.rollNo || '';
        const rollB = b.rollNo || '';
        return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
      });
      setStudents(res);
      setMarks(res.reduce((acc, s) => ({ ...acc, [s._id]: '' }), {}));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (section && year) fetchStudents(); }, [section, year]);

  // Fetch subjects for selected year and semester
  // Map semester for subject API
  useEffect(() => {
    if (year && semester) {
      const semesterNum = semester === 'sem1' ? '1' : semester === 'sem2' ? '2' : semester;
      apiRequest(`/subject?year=${year}&semester=${semesterNum}`)
        .then(setSubjects)
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
  }, [year, semester]);

  // Fetch section marks when all filters are selected
  useEffect(() => {
    if (filterSection && filterYear && filterSemester && filterSubject && filterAssessmentType) {
      fetchSectionMarks();
    }
  }, [filterSection, filterYear, filterSemester, filterSubject, filterAssessmentType]);

  useEffect(() => {
    if (filterYear && filterSemester) {
      const semesterNum = filterSemester === 'sem1' ? '1' : filterSemester === 'sem2' ? '2' : filterSemester;
      apiRequest(`/subject?year=${filterYear}&semester=${semesterNum}`)
        .then(setFilterSubjects)
        .catch(() => setFilterSubjects([]));
    } else {
      setFilterSubjects([]);
    }
  }, [filterYear, filterSemester]);

  const handleChange = (id, value) => {
    if (maxScore && Number(value) > Number(maxScore)) return; // Prevent over max
    setMarks(m => ({ ...m, [id]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    setError('');
    setWarning('');
    // Check for over-max marks before submitting
    for (const s of students) {
      if (marks[s._id] !== '' && Number(marks[s._id]) > Number(maxScore)) {
        setError(`Marks for ${s.userId?.name || s.rollNo} exceed max marks!`);
        return;
      }
    }
    try {
      for (const s of students) {
        if (marks[s._id] !== '') {
          const res = await apiRequest('/marks', {
            method: 'POST',
            body: JSON.stringify({
              studentId: s._id,
              subject,
              assessmentType,
              semester: semester === '1' ? 'sem1' : semester === '2' ? 'sem2' : semester,
              score: marks[s._id],
              maxScore,
              section,
              year,
              date: new Date().toISOString()
            })
          });
          if (res && res.warning) {
            setWarning(res.message);
          }
        }
      }
      setMsg('Marks saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchSectionMarks = async () => {
    setMarksLoading(true);
    setSectionMarks([]);
    setMarksTableError('');
    try {
      const params = [];
      if (filterSection) params.push(`section=${filterSection}`);
      if (filterYear) params.push(`year=${filterYear}`);
      if (filterSemester) params.push(`semester=${filterSemester === '1' ? 'sem1' : filterSemester === '2' ? 'sem2' : filterSemester}`);
      if (filterSubject) params.push(`subject=${encodeURIComponent(filterSubject)}`);
      if (filterAssessmentType) params.push(`assessmentType=${encodeURIComponent(filterAssessmentType)}`);
      const res = await apiRequest(`/marks/section/filter${params.length ? '?' + params.join('&') : ''}`);
      setSectionMarks(res);
    } catch (err) {
      setMarksTableError(err.message);
    } finally {
      setMarksLoading(false);
    }
  };

  const handleEdit = (mark) => {
    setEditRowId(mark._id);
    setEditScore(mark.score);
    setEditMaxScore(mark.maxScore);
  };

  const handleEditSave = async (mark) => {
    setMarksTableError('');
    try {
      await apiRequest(`/marks/${mark._id}`, {
        method: 'PUT',
        body: JSON.stringify({ score: editScore, maxScore: editMaxScore })
      });
      setEditRowId(null);
      fetchSectionMarks();
    } catch (err) {
      setMarksTableError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mark?')) return;
    setMarksTableError('');
    try {
      await apiRequest(`/marks/${id}`, { method: 'DELETE' });
      fetchSectionMarks();
    } catch (err) {
      setMarksTableError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm('Are you sure you want to delete these marks?')) return;
    setMarksTableError('');
    try {
      await Promise.all(selectedMarkIds.map(id => apiRequest(`/marks/${id}`, { method: 'DELETE' })));
      fetchSectionMarks();
      setSelectedMarkIds([]);
    } catch (err) {
      setMarksTableError(err.message);
    }
  };

  const toggleSelectMark = (id) => {
    if (selectedMarkIds.includes(id)) {
      setSelectedMarkIds(selectedMarkIds.filter(i => i !== id));
    } else {
      setSelectedMarkIds([...selectedMarkIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedMarkIds([]);
    } else {
      setSelectedMarkIds(sectionMarks.map(mark => mark._id));
    }
    setAllSelected(!allSelected);
  };

  useEffect(() => {
    if (sectionMarks.length > 0) {
      setAllSelected(sectionMarks.every(mark => selectedMarkIds.includes(mark._id)));
    }
  }, [sectionMarks, selectedMarkIds]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Bulk Marks Import UI */}
      <div className="mb-8">
        <MarksBulkImport onSuccess={handleBulkImportSuccess} />
      </div>

      <h2 className="text-2xl font-bold mb-4">Marks Management</h2>
      <form className="mb-6 flex flex-wrap gap-4 items-end" onSubmit={handleSubmit}>
        <select value={section} onChange={e => setSection(e.target.value)} className="p-2 border rounded" required>
          <option value="">Section</option>
          {['CSE-01','CSE-02','CSE-03','CSE-04','CSE-05','CSE-06'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)} className="p-2 border rounded" required>
          <option value="">Year</option>
          {['E-1','E-2','E-3','E-4'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={semester} onChange={e => setSemester(e.target.value)} className="p-2 border rounded" required>
          <option value="">Sem</option>
          {['1','2'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={subject} onChange={e => setSubject(e.target.value)} className="p-2 border rounded" required disabled={subjects.length === 0}>
          <option value="">{subjects.length === 0 ? 'No subjects available' : 'Subject'}</option>
          {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>
        <select value={assessmentType} onChange={e => setAssessmentType(e.target.value)} className="p-2 border rounded" required>
          <option value="">Assessment Type</option>
          <option value="AT 1">AT 1</option>
          <option value="AT 2">AT 2</option>
          <option value="AT 3">AT 3</option>
          <option value="AT 4">AT 4</option>
          <option value="MID 1">MID 1</option>
          <option value="MID 2">MID 2</option>
          <option value="MID 3">MID 3</option>
          <option value="Others">Others</option>
        </select>
        <input value={maxScore} onChange={e => setMaxScore(e.target.value)} placeholder="Max Score" className="p-2 border rounded" required type="number" />
      </form>

      {msg && <div className="mb-2 text-green-600 font-semibold bg-green-100 border border-green-400 rounded px-4 py-2 animate-pulse">{msg}</div>}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {warning && <div className="mb-2 text-yellow-700 font-semibold bg-yellow-100 border border-yellow-400 rounded px-4 py-2 animate-pulse">{warning}</div>}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {loading ? <div>Loading students...</div> : (
        students.length > 0 ? (
           <>
           <table className="w-full border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-center">Name</th>
                <th className="p-2 text-center">ID Number</th>
                <th className="p-2 text-center">Roll No</th>
                <th className="p-2 text-center">Score</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id} className="border-t">
                  <td className="p-2 text-center">{s.userId?.name}</td>
                  <td className="p-2 text-center">{s.idNumber || '-'}</td>
                  <td className="p-2 text-center">{s.rollNo}</td>
                  <td className="p-2 text-center">
                    <input type="number" className="border rounded p-1 w-24 text-center" value={marks[s._id] || ''} onChange={e => handleChange(s._id, e.target.value)} max={maxScore} min={0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center mt-4">
            <button className="bg-primary text-white px-6 py-2 rounded shadow hover:bg-primary-dark transition" onClick={handleSubmit} type="button">
              Save Marks
            </button>
          </div>
           </>
        ) : (
          section && year && <div>No students found for this section/year.</div>
        )
      )}
      {/* Section Marks Management UI */}
      <div className="mt-12 mb-8 p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">View / Edit / Delete Section Marks</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="p-2 border rounded">
            <option value="">Section</option>
            {['CSE-01','CSE-02','CSE-03','CSE-04','CSE-05','CSE-06'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="p-2 border rounded">
            <option value="">Year</option>
            {['E-1','E-2','E-3','E-4'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="p-2 border rounded">
            <option value="">Sem</option>
            {['1','2'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="p-2 border rounded" disabled={filterSubjects.length === 0}>
            <option value="">{filterSubjects.length === 0 ? 'No subjects available' : 'Subject'}</option>
            {filterSubjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
          </select>
          <select value={filterAssessmentType} onChange={e => setFilterAssessmentType(e.target.value)} className="p-2 border rounded">
            <option value="">Assessment Type</option>
            <option value="AT 1">AT 1</option>
            <option value="AT 2">AT 2</option>
            <option value="AT 3">AT 3</option>
            <option value="AT 4">AT 4</option>
            <option value="MID 1">MID 1</option>
            <option value="MID 2">MID 2</option>
            <option value="MID 3">MID 3</option>
            </select>
         </div>
         {/* Section Marks Table */}
        {marksLoading ? (
          <div>Loading marks...</div>
        ) : marksTableError ? (
          <div className="text-red-600">{marksTableError}</div>
        ) : sectionMarks.length > 0 ? (
          <>
          <table className="w-full border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-center"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /></th>
<th className="p-2 text-center">Semester</th>
<th className="p-2 text-center">Subject</th>
<th className="p-2 text-center">ID Number</th>
<th className="p-2 text-center">Roll No</th>
<th className="p-2 text-center">Assessment Type</th>
<th className="p-2 text-center">Score</th>
<th className="p-2 text-center">Max Score</th>
<th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sectionMarks.map(mark => (
                <tr key={mark._id} className="border-t">
  <td className="p-2 text-center"><input type="checkbox" checked={selectedMarkIds.includes(mark._id)} onChange={() => toggleSelectMark(mark._id)} /></td>
  <td className="p-2 text-center">{mark.semester || '-'}</td>
  <td className="p-2 text-center">{mark.subject || '-'}</td>
  <td className="p-2 text-center">{mark.studentId?.idNumber || '-'}</td>
  <td className="p-2 text-center">{mark.studentId?.rollNo || '-'}</td>
  <td className="p-2 text-center">{mark.assessmentType}</td>
  <td className="p-2 text-center">
    {editRowId === mark._id ? (
      <input type="number" className="border rounded p-1 w-16 text-center" value={editScore} onChange={e => setEditScore(e.target.value)} />
    ) : mark.score}
  </td>
  <td className="p-2 text-center">
    {editRowId === mark._id ? (
      <input type="number" className="border rounded p-1 w-16 text-center" value={editMaxScore} onChange={e => setEditMaxScore(e.target.value)} />
    ) : mark.maxScore}
  </td>
  <td className="p-2 text-center">
    <div className="flex items-center justify-center gap-2">
      {editRowId === mark._id ? (
        <>
          <button title="Save" className="text-green-600 font-semibold mr-1" onClick={() => handleEditSave(mark)}>Save</button>
          <button title="Cancel" className="text-gray-600 font-semibold" onClick={() => setEditRowId(null)}>Cancel</button>
        </>
      ) : (
        <>
          <button title="Edit" className="text-blue-600 font-semibold mr-1" onClick={() => handleEdit(mark)}><EditIcon /></button>
          <button title="Delete" className="text-red-600 font-semibold" onClick={() => handleDelete(mark._id)}><TrashIcon /></button>
        </>
      )}
    </div>
  </td>
</tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mt-2">
            <button className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-800 transition disabled:opacity-50" type="button" onClick={handleBulkDelete} disabled={selectedMarkIds.length === 0 || marksLoading}>
              Delete Selected
            </button>
          </div>
          </>
        ) : (
          <div>No marks found for the selected filters.</div>
        )}
      </div>
      </div>
     );
}
