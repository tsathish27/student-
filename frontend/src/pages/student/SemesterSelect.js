import React from 'react';

export default function SemesterSelect({ value, onChange, disabled }) {
  return (
    <select
      className="border rounded p-2 w-40"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">Select Semester</option>
      <option value="1">Semester 1</option>
      <option value="2">Semester 2</option>
    </select>
  );
}
