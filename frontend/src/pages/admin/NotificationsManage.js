import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { TrashIcon } from './_Icon';

export default function NotificationsManage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ message: '', type: 'info', target: 'all', year: '', section: '' });
  const [selected, setSelected] = useState([]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/notification');
      setNotifications(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchNotifications(); }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value, ...(name === 'target' ? { year: '', section: '' } : {}) }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await apiRequest(`/notification/${id}`, { method: 'DELETE' });
      fetchNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      const body = { ...form };
      // Only send year/section if needed, otherwise remove
      if (form.target !== 'year') body.year = '';
      if (form.target !== 'section') body.section = '';
      // --- Fix: ensure target is set correctly ---
      if (form.target === 'section' && (!form.year || !form.section)) {
        setError('Please select both year and section for section notification.');
        return;
      }
      if (form.target === 'year' && !form.year) {
        setError('Please select year for year notification.');
        return;
      }
      // If target is section, keep target as 'section' (do not default to 'all')
      await apiRequest('/notification', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setMsg('Notification sent!');
      setForm({ message: '', type: 'info', target: 'all', year: '', section: '' });
      fetchNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelect = (id, checked) => {
    setSelected(sel => checked ? [...sel, id] : sel.filter(x => x !== id));
  };
  const handleSelectAll = e => {
    if (e.target.checked) {
      setSelected(notifications.map(n => n._id));
    } else {
      setSelected([]);
    }
  };
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} selected notifications?`)) return;
    setLoading(true);
    setError('');
    try {
      await apiRequest('/notification/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected })
      });
      setSelected([]);
      fetchNotifications();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Notifications Management</h2>
      <form className="mb-8 flex flex-wrap gap-4 items-end" onSubmit={handleSubmit}>
        <input name="message" value={form.message} onChange={handleChange} placeholder="Message" className="p-2 border rounded w-80" required />
        <select name="type" value={form.type} onChange={handleChange} className="p-2 border rounded">
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="danger">Danger</option>
        </select>
        <select name="target" value={form.target} onChange={handleChange} className="p-2 border rounded">
          <option value="all">All Students</option>
          <option value="year">Year</option>
          <option value="section">Section</option>
        </select>
        {form.target === 'year' && (
          <select name="year" value={form.year} onChange={handleChange} className="p-2 border rounded">
            <option value="">Select Year</option>
            {['E-1','E-2','E-3','E-4'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {form.target === 'section' && (
          <>
            <select name="year" value={form.year} onChange={handleChange} className="p-2 border rounded">
              <option value="">Select Year</option>
              {['E-1','E-2','E-3','E-4'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {form.year && (
              <select name="section" value={form.section} onChange={handleChange} className="p-2 border rounded">
                <option value="">All Sections</option>
                {['CSE-01','CSE-02','CSE-03','CSE-04','CSE-05','CSE-06'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </>
        )}
        <button className="bg-primary text-white px-4 py-2 rounded" type="submit">Send</button>
      </form>
      {selected.length > 0 && (
        <button className="bg-red-600 text-white px-4 py-2 rounded mb-2" onClick={handleBulkDelete}>
          Delete Selected ({selected.length})
        </button>
      )}
      {msg && <div className="mb-2 text-green-600">{msg}</div>}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {loading ? <div>Loading...</div> : (
        notifications.length > 0 ? (
          <table className="w-full border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2"><input type="checkbox" onChange={handleSelectAll} checked={selected.length === notifications.length && notifications.length > 0} /></th>
                <th className="p-2">Message</th>
                <th className="p-2">Type</th>
                <th className="p-2">Target</th>
                <th className="p-2">Created At</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n._id} className="border-t">
                  <td className="p-2 text-center">
                    <input type="checkbox" checked={selected.includes(n._id)} onChange={e => handleSelect(n._id, e.target.checked)} />
                  </td>
                  <td className="p-2 text-center">{n.message}</td>
                  <td className="p-2 text-center">{n.type}</td>
                  <td className="p-2 text-center">{n.target || 'all'}{n.section ? ` (${n.section === '' ? 'All Sections' : n.section})` : ''}{n.year ? ` (${n.year})` : ''}</td>
                  <td className="p-2 text-center">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</td>
                  <td className="p-2 text-center">
                    <button title="Delete" className="text-red-600 hover:text-red-800 mx-1 align-middle" onClick={() => handleDelete(n._id)}>
                      <TrashIcon className="inline-block align-middle" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && <div>No notifications found.</div>
        )
      )}
    </div>
  );
}
