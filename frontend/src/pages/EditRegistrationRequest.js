import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api';

export default function EditRegistrationRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', section: '', year: '', rollNo: '', idNumber: '', phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    apiRequest(`/student-registration/requests/${id}`)
      .then(data => {
        setForm({
          name: data.name || '',
          email: data.email || '',
          section: data.section || '',
          year: data.year || '',
          rollNo: data.rollNo || '',
          idNumber: data.idNumber || '',
          phone: data.phone || ''
        });
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/student-registration/requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(form)
      });
      setSuccess('Request updated successfully!');
      setTimeout(() => navigate('/registration-status'), 1200);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">Edit Registration Request</h2>
      {success && <div className="mb-4 text-green-700">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full border rounded px-3 py-2" name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
        <input className="w-full border rounded px-3 py-2" name="email" value={form.email} onChange={handleChange} placeholder="Email" required type="email" />
        <input className="w-full border rounded px-3 py-2" name="section" value={form.section} onChange={handleChange} placeholder="Section" required />
        <input className="w-full border rounded px-3 py-2" name="year" value={form.year} onChange={handleChange} placeholder="Year" required />
        <input className="w-full border rounded px-3 py-2" name="rollNo" value={form.rollNo} onChange={handleChange} placeholder="Roll No" required />
        <input className="w-full border rounded px-3 py-2" name="idNumber" value={form.idNumber} onChange={handleChange} placeholder="ID Number" required />
        <input className="w-full border rounded px-3 py-2" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />
        <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700" type="submit">Update Request</button>
      </form>
    </div>
  );
}
