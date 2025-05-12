import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import AttendanceBulkImport from './AttendanceBulkImport';

import { fetchExistingAttendance } from './AttendanceManageHelpers';

export default function AttendanceManage() {
  // ...existing state and logic...

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [lockedAttendance, setLockedAttendance] = useState({}); // New state for locked attendance
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [section, setSection] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [msg, setMsg] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Restriction constants
  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgoStr = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // New state variables for view/edit/delete attendance section
  const [viewSection, setViewSection] = useState('');
  const [viewYear, setViewYear] = useState('');
  const [viewSemester, setViewSemester] = useState('');
  const [viewSubject, setViewSubject] = useState('');
  const [viewDate, setViewDate] = useState(() => todayStr); // Default to today
  const [viewSubjects, setViewSubjects] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState('');
  const [editRecordId, setEditRecordId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

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
      // Do not set attendance here; attendance will be set by the attendance loader effect based on existing records
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students only after all filters are selected
  useEffect(() => {
    if (section && year && semester && subject) fetchStudents();
  }, [section, year, semester, subject]);

  // Fetch and set attendance for selected date/section/year/semester/subject
  useEffect(() => {
    async function loadAttendance() {
      if (!date || !section || !year || !semester || !subject || students.length === 0) return;
      const records = await fetchExistingAttendance({ date, section, year, semester, subject });
      // Defensive: handle null/undefined/empty
      let attendanceArray = [];
      if (records) {
        if (Array.isArray(records.records)) {
          attendanceArray = records.records;
        } else if (Array.isArray(records)) {
          attendanceArray = records;
        }
      }
      // Map studentId to status, default to 'Present'. If record exists, mark as locked
      const att = {};
      const locked = {};
      students.forEach(s => {
        const rec = attendanceArray.find(r => {
          if (!r.studentId) return false;
          if (typeof r.studentId === 'string') return r.studentId === s._id;
          if (typeof r.studentId === 'object' && r.studentId._id) return r.studentId._id === s._id;
          return false;
        });
        att[s._id] = rec && rec.status ? rec.status : 'Present';
        locked[s._id] = !!rec; // true if record exists
      });
      setAttendance(att);
      setLockedAttendance(locked);
    }
    loadAttendance();
  }, [date, section, year, semester, subject, students]);

  // Reset attendance when students change
  useEffect(() => {
    if (students.length === 0) setAttendance({});
  }, [students]);

  // Fetch subjects for selected year and semester
  useEffect(() => {
    if (year && semester) {
      const semesterNum = semester === 'sem1' ? '1' : semester === 'sem2' ? '2' : '';
      apiRequest(`/subject?year=${year}&semester=${semesterNum}`)
        .then(setSubjects)
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
  }, [year, semester]);

  // New effect to fetch attendance records for view/edit/delete section
  useEffect(() => {
    if (viewYear && viewSemester) {
      const semesterNum = viewSemester === 'sem1' ? '1' : viewSemester === 'sem2' ? '2' : '';
      apiRequest(`/subject?year=${viewYear}&semester=${semesterNum}`)
        .then(setViewSubjects)
        .catch(() => setViewSubjects([]));
    } else {
      setViewSubjects([]);
    }
  }, [viewYear, viewSemester]);

  const handleChange = (id, status) => setAttendance(a => ({ ...a, [id]: status }));

  const handleMarkAllPresent = () => {
    if (students.length === 0) return;
    setAttendance(a => {
      const updated = { ...a };
      students.forEach(s => { updated[s._id] = 'Present'; });
      return updated;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    setError('');
    // Prevent marking attendance for future dates
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (date > today) {
      setError('Attendance cannot be marked for future dates. Please select today or a past date.');
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Attendance cannot be marked for future dates.', type: 'error' } }));
      return;
    }
    if (date < sevenDaysAgo) {
      setError('Attendance can only be marked for today or the last 7 days.');
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Attendance can only be marked for today or the last 7 days.', type: 'error' } }));
      return;
    }
    // Validate subject exists in the dropdown
    if (!subjects.some(s => s.name === subject)) {
      setError('Selected subject is invalid.');
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Selected subject is invalid.', type: 'error' } }));
      return;
    }
    setMsg('');
    setError('');
    setLoading(true);
    try {
      const response = await apiRequest(`/attendance/`, {
        method: 'POST',
        body: JSON.stringify({
          date,
          section,
          year,
          semester,
          subject,
          records: Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }))
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      // If all records were skipped (no new or updated attendance), show info toast
      if (response && response.inserted && response.inserted.length === 0) {
        setMsg('No new attendance was marked. All selected records already exist with the same status.');
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'No new attendance was marked. All selected records already exist with the same status.', type: 'info' } }));
      } else {
        setMsg('Attendance saved successfully!');
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Attendance saved successfully!', type: 'success' } }));
      }
      fetchAttendanceRecords();
    } catch (err) {
      setError(err.message || 'Failed to save attendance.');
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message || 'Failed to save attendance.', type: 'error' } }));
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch attendance records for view/edit/delete section
  const fetchAttendanceRecords = async () => {
    setRecordsLoading(true);
    setRecordsError('');
    try {
      const params = [];
      if (viewDate) params.push(`date=${viewDate}`);
      if (viewSection) params.push(`section=${viewSection}`);
      if (viewYear) params.push(`year=${viewYear}`);
      if (viewSemester) params.push(`semester=${viewSemester}`);
      if (viewSubject) params.push(`subject=${encodeURIComponent(viewSubject)}`);
      const res = await apiRequest(`/attendance/existing?${params.join('&')}`);
      // Defensive: handle both array and { records: [...] }
      let recordsArray = [];
      if (Array.isArray(res)) {
        recordsArray = res;
      } else if (res && Array.isArray(res.records)) {
        recordsArray = res.records;
      }
      setAttendanceRecords(recordsArray);
    } catch (err) {
      setRecordsError(err.message || 'Failed to fetch attendance records.');
    } finally {
      setRecordsLoading(false);
    }
  };

  // New function to handle edit attendance record
  const handleEdit = record => {
    setEditRecordId(record._id);
    setEditStatus(record.status);
  };

  // New function to handle save edited attendance record
  const handleEditSave = async record => {
    setRecordsLoading(true);
    try {
      await apiRequest(`/attendance/${record._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: editStatus }),
        headers: { 'Content-Type': 'application/json' }
      });
      setAttendanceRecords(attendanceRecords.map(r => r._id === record._id ? { ...r, status: editStatus } : r));
      setEditRecordId(null);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Attendance record updated successfully!', type: 'success' } }));
    } catch (err) {
      setRecordsError(err.message || 'Failed to update attendance record.');
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message || 'Failed to update attendance record.', type: 'error' } }));
    } finally {
      setRecordsLoading(false);
    }
  };

  // New function to handle delete attendance record
  const handleDelete = async id => {
    setRecordsLoading(true);
    try {
      await apiRequest(`/attendance/${id}`, { method: 'DELETE' });
      setAttendanceRecords(attendanceRecords.filter(r => r._id !== id));
    } catch (err) {
      setRecordsError(err.message || 'Failed to delete attendance record.');
    } finally {
      setRecordsLoading(false);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm('Are you sure you want to delete the selected attendance records?')) return;
    setRecordsLoading(true);
    try {
      await Promise.all(selectedIds.map(id => apiRequest(`/attendance/${id}`, { method: 'DELETE' })));
      setAttendanceRecords(attendanceRecords.filter(r => !selectedIds.includes(r._id)));
      setSelectedIds([]);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Selected records deleted.', type: 'success' } }));
    } catch (err) {
      setRecordsError(err.message || 'Failed to delete selected records.');
    } finally {
      setRecordsLoading(false);
    }
  };

  // Utility: Are there any students eligible for marking attendance (not locked)?
  const anyUnlocked = students.some(s => !lockedAttendance[s._id]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <AttendanceBulkImport onSuccess={() => { setMsg('Bulk attendance import successful!'); }} />
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-primary-dark mb-4 drop-shadow">Attendance Management</h2>
      </div>
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
          <option value="sem1">Semester 1</option>
          <option value="sem2">Semester 2</option>
        </select>
        <select value={subject} onChange={e => setSubject(e.target.value)} className="p-2 border rounded" required disabled={subjects.length === 0}>
          <option value="">{subjects.length === 0 ? 'No subjects available' : 'Subject'}</option>
          {subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
        <input
          type="date"
          value={date}
          min={sevenDaysAgoStr}
          max={todayStr}
          onChange={e => setDate(e.target.value)}
          className="p-2 border rounded"
          required
        />
      </form>
      {msg && <div className="mb-2 text-green-600 font-semibold bg-green-100 border border-green-400 rounded px-4 py-2 animate-pulse">{msg}</div>}
      {error && <div className="mb-2 text-red-600 bg-red-100 border border-red-400 rounded px-4 py-2">{error}</div>}
      {loading ? <div>Loading students...</div> : (
        students.length > 0 ? (
          <>
            <table className="w-full border mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-center">Name</th>
                  <th className="p-2 text-center">ID Number</th>
                  <th className="p-2 text-center">Roll No</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id} className="border-t">
                    <td className="p-2 text-center">{s.userId?.name || '-'}</td>
                    <td className="p-2 text-center">{s.idNumber || '-'}</td>
                    <td className="p-2 text-center">{s.rollNo || '-'}</td>
                    <td className="p-2 text-center">
                      <select
                        className="border rounded p-1 w-28 text-center"
                        value={attendance[s._id] || 'Present'}
                        onChange={e => handleChange(s._id, e.target.value)}
                        disabled={loading || lockedAttendance[s._id]} // Disable if lockedAttendance is true
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center mt-4">
              <button className="bg-primary text-white px-6 py-2 rounded shadow hover:bg-primary-dark transition" type="button" onClick={handleMarkAllPresent} disabled={students.length === 0 || loading || !anyUnlocked}>Mark All Present</button>
              <button className="bg-primary text-white px-6 py-2 rounded ml-4 shadow hover:bg-primary-dark transition" type="button" onClick={handleSubmit} disabled={!date || !section || !year || !semester || !subject || students.length === 0 || loading || !anyUnlocked}>Save Attendance</button>
            </div>
          </>
        ) : (
          section && year && <div>No students found for this section/year.</div>
        )
      )}
      {/* --- View/Edit/Delete Attendance Section --- */}
      <div className="mt-12 mb-8 p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">View / Edit / Delete Attendance</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <select value={viewSection} onChange={e => setViewSection(e.target.value)} className="p-2 border rounded">
            <option value="">Section</option>
            {['CSE-01','CSE-02','CSE-03','CSE-04','CSE-05','CSE-06'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={viewYear} onChange={e => setViewYear(e.target.value)} className="p-2 border rounded">
            <option value="">Year</option>
            {['E-1','E-2','E-3','E-4'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={viewSemester} onChange={e => setViewSemester(e.target.value)} className="p-2 border rounded">
            <option value="">Sem</option>
            <option value="sem1">Semester 1</option>
            <option value="sem2">Semester 2</option>
          </select>
          <select value={viewSubject} onChange={e => setViewSubject(e.target.value)} className="p-2 border rounded" disabled={viewSubjects.length === 0}>
            <option value="">{viewSubjects.length === 0 ? 'No subjects available' : 'Subject'}</option>
            {viewSubjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
          <input
            type="date"
            value={viewDate}
            min={sevenDaysAgoStr}
            max={todayStr}
            onChange={e => setViewDate(e.target.value)}
            className="p-2 border rounded"
          />
          <button className="bg-primary text-white px-4 py-2 rounded" type="button" onClick={fetchAttendanceRecords}>Filter</button>
        </div>
        {recordsError && <div className="mb-2 text-red-600">{recordsError}</div>}
        {recordsLoading ? (
          <div>Loading attendance...</div>
        ) : (
          attendanceRecords.length > 0 ? (
            <>
              <table className="w-full border mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-center">
                      <input type="checkbox" checked={selectedIds.length === attendanceRecords.length && attendanceRecords.length > 0} onChange={e => setSelectedIds(e.target.checked ? attendanceRecords.map(r => r._id) : [])} />
                    </th>
                    <th className="p-2 text-center">Date</th>
                    <th className="p-2 text-center">Section</th>
                    <th className="p-2 text-center">Year</th>
                    <th className="p-2 text-center">Semester</th>
                    <th className="p-2 text-center">Subject</th>
                    <th className="p-2 text-center">Student</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(record => (
                    <tr key={record._id} className="border-t">
                      <td className="p-2 text-center">
                        <input type="checkbox" checked={selectedIds.includes(record._id)} onChange={e => setSelectedIds(ids => e.target.checked ? [...ids, record._id] : ids.filter(id => id !== record._id))} />
                      </td>
                      <td className="p-2 text-center">{record.date ? new Date(record.date).toLocaleDateString() : ''}</td>
                      <td className="p-2 text-center">{record.section}</td>
                      <td className="p-2 text-center">{record.year}</td>
                      <td className="p-2 text-center">{record.semester}</td>
                      <td className="p-2 text-center">{record.subject}</td>
                      <td className="p-2 text-center">{record.studentId?.name || record.studentId?.idNumber || record.studentId}</td>
                      <td className="p-2 text-center">
                        {editRecordId === record._id ? (
                          <select className="border rounded p-1 w-24 text-center" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                          </select>
                        ) : record.status}
                      </td>
                      <td className="p-2 text-center flex items-center justify-center gap-2">
                        {editRecordId === record._id ? (
                          <>
                            <button title="Save" className="text-green-600 font-semibold mr-1" onClick={() => handleEditSave(record)}>
                              Save
                            </button>
                            <button title="Cancel" className="text-gray-600 font-semibold" onClick={() => setEditRecordId(null)}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button title="Edit" className="text-blue-600 font-semibold mr-1" onClick={() => handleEdit(record)}>
                              Edit
                            </button>
                            <button title="Delete" className="text-red-600 font-semibold" onClick={() => handleDelete(record._id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <button className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-800 transition disabled:opacity-50" type="button" onClick={handleBulkDelete} disabled={selectedIds.length === 0 || recordsLoading}>
                  Delete Selected
                </button>
              </div>
            </>
          ) : (
            (viewSection && viewYear && viewSemester) && (
              <div>No attendance records found for this filter.</div>
            )
          )
        )}
      </div>
    </div>
  );
}
