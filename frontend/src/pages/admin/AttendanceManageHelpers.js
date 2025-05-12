import { apiRequest } from '../../api';

export async function fetchExistingAttendance({ date, section, year, semester, subject }) {
  // Returns attendance records for the given parameters
  if (!date || !section || !year || !semester || !subject) return null;
  try {
    // Normalize date to midnight UTC in ISO format (yyyy-mm-dd)
    let normalizedDate = '';
    if (date) {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      normalizedDate = d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    }
    const params = new URLSearchParams({ date: normalizedDate, section, year, semester, subject });
    const data = await apiRequest(`/attendance/existing?${params.toString()}`);
    return data;
  } catch (err) {
    return null;
  }
}

// Bulk import helpers removed. No attendance bulk import logic remains in this file.
