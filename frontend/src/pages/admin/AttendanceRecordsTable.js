import React, { useState } from 'react';

function AttendanceViewer({ viewingAttendance, viewingLoading, viewingError }) {
  const [selectedDate, setSelectedDate] = useState('');

  return (
    <div className="p-4">
      {/* Date Selection */}
      <div className="mb-4">
        <label htmlFor="attendance-date" className="mr-2 font-semibold">
          Select Date:
        </label>
        <input
          type="date"
          id="attendance-date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
      </div>

      {/* View Attendance Result Table */}
      {viewingLoading && (
        <div className="mb-2 text-gray-600">Loading attendance...</div>
      )}

      {viewingError && (
        <div className="mb-2 text-red-600">{viewingError}</div>
      )}

      {!viewingLoading && viewingAttendance && viewingAttendance.length > 0 && (
        <table className="w-full border border-gray-300 mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Section</th>
              <th className="border px-4 py-2">Year</th>
              <th className="border px-4 py-2">Semester</th>
              <th className="border px-4 py-2">Subject</th>
              <th className="border px-4 py-2">Student</th>
              <th className="border px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {viewingAttendance.map(record => (
              <tr key={record._id}>
                <td className="border px-4 py-2">
                  {record.date ? new Date(record.date).toLocaleDateString() : ''}
                </td>
                <td className="border px-4 py-2">{record.section}</td>
                <td className="border px-4 py-2">{record.year}</td>
                <td className="border px-4 py-2">{record.semester}</td>
                <td className="border px-4 py-2">{record.subject}</td>
                <td className="border px-4 py-2">
                  {record.studentId?.name ||
                    record.studentId?.idNumber ||
                    record.studentId}
                </td>
                <td className="border px-4 py-2">{record.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!viewingLoading && viewingAttendance && viewingAttendance.length === 0 && (
        <div className="mb-2 text-blue-600">
          No attendance exists for the selected date.
        </div>
      )}
    </div>
  );
}

export default AttendanceViewer;
