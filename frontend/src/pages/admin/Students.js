import React, { useEffect, useState, useMemo } from 'react';
import { apiRequest } from '../../api';
import { EditIcon, TrashIcon } from './_Icon';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', section: '', year: '', rollNo: '', idNumber: '', phone: '' });
  const [filterYear, setFilterYear] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [sortAsc, setSortAsc] = useState(true);

  // Dropdown options
  const sectionOptions = ['CSE-01', 'CSE-02', 'CSE-03', 'CSE-04', 'CSE-05', 'CSE-06'];
  const yearOptions = ['E-1', 'E-2', 'E-3', 'E-4'];
  const [editing, setEditing] = useState(null);
  const [importMsg, setImportMsg] = useState('');

  // --- Bulk Delete State ---
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const fetchStudents = () => {
    setLoading(true);
    const params = [];
    if (filterYear) params.push(`year=${filterYear}`);
    if (filterSection) params.push(`section=${filterSection}`);
    const query = params.length ? `?${params.join('&')}` : '';
    apiRequest(`/student${query}`)
      .then(setStudents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudents(); }, [filterYear, filterSection]);

  useEffect(() => {
    setCurrentPage(1); // Reset page when filters change
  }, [filterYear, filterSection]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editing) {
        await apiRequest(`/student/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
      } else {
        await apiRequest('/student', {
          method: 'POST',
          body: JSON.stringify(form)
        });
      }
      setForm({ name: '', email: '', password: '', section: '', year: '', rollNo: '', idNumber: '', phone: '' });
      setEditing(null);
      fetchStudents();
    } catch (err) { setError(err.message); }
  };

  const handleEdit = s => {
    setEditing(s._id);
    setForm({
      name: s.userId?.name || '',
      email: s.userId?.email || '',
      password: '',
      section: s.section || '',
      year: s.year || '',
      rollNo: s.rollNo || '',
      idNumber: s.idNumber || '',
      phone: s.phone || ''
    });
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await apiRequest(`/student/${id}`, { method: 'DELETE' });
      fetchStudents();
    } catch (err) { setError(err.message); }
  };

  const handleImport = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${window.location.origin.replace(/:[0-9]+$/, ':5000')}/api/import/students`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      setImportMsg(data.message || 'Import complete');
      fetchStudents();
    } catch (err) { setImportMsg('Import failed'); }
  };

  const handleSelect = (id, checked) => {
    setSelectedIds(ids => checked ? [...ids, id] : ids.filter(_id => _id !== id));
  };
  const handleSelectAll = checked => {
    if (checked) {
      setSelectedIds(displayedStudents.map(s => s._id));
    } else {
      setSelectedIds([]);
    }
  };
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected student(s)?`)) return;
    setBulkDeleteLoading(true);
    try {
      await apiRequest(`/student/bulk-delete`, {
        method: 'DELETE',
        body: JSON.stringify({ ids: selectedIds })
      });
      setSelectedIds([]);
      fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const displayedStudents = useMemo(() => {
    let data = [...students];
    data.sort((a, b) => {
      const rollA = parseInt(a.rollNo), rollB = parseInt(b.rollNo);
      return sortAsc ? rollA - rollB : rollB - rollA;
    });
    const start = (currentPage - 1) * studentsPerPage;
    return data.slice(start, start + studentsPerPage);
  }, [students, sortAsc, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(students.length / studentsPerPage);
  }, [students]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manage Students</h2>
      <form className="mb-6 flex flex-wrap gap-4" onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="p-2 border rounded" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="p-2 border rounded" required type="email" />
        <input name="password" value={form.password} onChange={handleChange} placeholder="Password" className="p-2 border rounded" type="password" required={!editing} />
        <select name="section" value={form.section} onChange={handleChange} className="p-2 border rounded" required>
          <option value="">Section</option>
          {sectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select name="year" value={form.year} onChange={handleChange} className="p-2 border rounded" required>
          <option value="">Year</option>
          {yearOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <input name="rollNo" value={form.rollNo} onChange={handleChange} placeholder="Roll No" className="p-2 border rounded" required />
        <input name="idNumber" value={form.idNumber} onChange={handleChange} placeholder="ID Number" className="p-2 border rounded" required />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="p-2 border rounded" />
        <button className="bg-primary text-white px-4 py-2 rounded" type="submit">{editing ? 'Update' : 'Add'} Student</button>
        {editing && <button type="button" className="ml-2 px-4 py-2 bg-gray-400 text-white rounded" onClick={() => { setEditing(null); setForm({ name: '', email: '', password: '', section: '', year: '', rollNo: '', idNumber: '', phone: '' }); }}>Cancel</button>}
      </form>
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Bulk Import (Excel):</label>
        <input type="file" accept=".xlsx,.xls" onChange={handleImport} />
        {importMsg && <div className="mt-2 text-green-600">{importMsg}</div>}
      </div>
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block mb-1 font-semibold">Filter by Year:</label>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="p-2 border rounded">
            <option value="">All</option>
            {yearOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Filter by Section:</label>
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="p-2 border rounded">
            <option value="">All</option>
            {sectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <table className="w-full border mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-center">
              <input
                type="checkbox"
                checked={selectedIds.length === displayedStudents.length && displayedStudents.length > 0}
                onChange={e => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="p-2 text-center">Name</th>
            <th className="p-2 text-center">Email</th>
            <th className="p-2 text-center">Section</th>
            <th className="p-2 text-center">Year</th>
            <th className="p-2 text-center">Roll No</th>
            <th className="p-2 text-center">ID Number</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayedStudents.map(s => (
            <tr key={s._id} className="border-t">
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(s._id)}
                  onChange={e => handleSelect(s._id, e.target.checked)}
                />
              </td>
              <td className="p-2 text-center">{s.userId?.name}</td>
              <td className="p-2 text-center">{s.userId?.email}</td>
              <td className="p-2 text-center">{s.section}</td>
              <td className="p-2 text-center">{s.year}</td>
              <td className="p-2 text-center">{s.rollNo}</td>
              <td className="p-2 text-center">{s.idNumber}</td>
              <td className="p-2 text-center">
                <button className="text-blue-600 hover:text-blue-800 mx-1 align-middle" title="Edit" onClick={() => handleEdit(s)}>
                  <EditIcon className="inline-block align-middle" />
                </button>
                <button className="text-red-600 hover:text-red-800 mx-1 align-middle" title="Delete" onClick={() => handleDelete(s._id)}>
                  <TrashIcon className="inline-block align-middle" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-4 mt-2">
        <button
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={selectedIds.length === 0 || bulkDeleteLoading}
          onClick={handleBulkDelete}
        >
          {bulkDeleteLoading ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
        </button>
      </div>
      <div className="flex justify-between mt-4">
        <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
        <span className="mx-2">Page {currentPage} of {totalPages}</span>
        <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
      </div>
    </div>
  );
}
