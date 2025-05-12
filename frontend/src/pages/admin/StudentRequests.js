import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

export default function AdminStudentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // id of request being processed
  const [selected, setSelected] = useState([]);
  const [editRequest, setEditRequest] = useState(null);

  const fetchRequests = () => {
    setLoading(true);
    apiRequest('/student-registration/requests')
      .then(setRequests)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);
  // Update global badge for pending requests
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__pendingStudentRequests = requests.length;
      window.dispatchEvent(new CustomEvent('pending-student-requests-update'));
    }
  }, [requests]);

  const handleApprove = async id => {
    setActionLoading(id);
    try {
      await apiRequest(`/student-registration/requests/${id}/approve`, { method: 'POST' });
      fetchRequests();
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Student approved and account created.', type: 'success' } }));
    } catch (err) { /* error toast shown by apiRequest */ }
    setActionLoading(null);
  };

  const handleReject = async id => {
    const reason = prompt('Enter reason for rejection (optional):') || '';
    setActionLoading(id);
    try {
      await apiRequest(`/student-registration/requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      fetchRequests();
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Registration request rejected.', type: 'error' } }));
    } catch (err) { }
    setActionLoading(null);
  };

  // Bulk Approve
  const handleBulkApprove = async () => {
    if (selected.length === 0) return;
    setActionLoading('bulk-approve');
    try {
      await Promise.all(selected.map(id => apiRequest(`/student-registration/requests/${id}/approve`, { method: 'POST' })));
      fetchRequests();
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Selected students approved.', type: 'success' } }));
      setSelected([]);
    } catch (err) {}
    setActionLoading(null);
  };

  // Bulk Reject
  const handleBulkReject = async () => {
    if (selected.length === 0) return;
    let reason = prompt('Enter reason for rejection for all selected (optional):') || 'N/A';
    setActionLoading('bulk-reject');
    try {
      await Promise.all(selected.map(id => apiRequest(`/student-registration/requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'N/A' })
      })));
      fetchRequests();
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Selected requests rejected.', type: 'error' } }));
      setSelected([]);
    } catch (err) {}
    setActionLoading(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Pending Student Registration Requests</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="overflow-x-auto">
        <div className="min-w-fit w-full">
          <div className="flex gap-3 mb-2">
            <button className="bg-green-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50" disabled={selected.length===0||actionLoading==='bulk-approve'} onClick={handleBulkApprove}>Bulk Approve</button>
            <button className="bg-red-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50" disabled={selected.length===0||actionLoading==='bulk-reject'} onClick={handleBulkReject}>Bulk Reject</button>
          </div>
          <table className="w-auto min-w-max border mt-4 text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 whitespace-nowrap"><input type="checkbox" checked={selected.length === requests.length && requests.length > 0} onChange={e => setSelected(e.target.checked ? requests.map(r=>r._id) : [])} /></th>
                <th className="p-2 whitespace-nowrap">Name</th>
                <th className="p-2 whitespace-nowrap">Email</th>
                <th className="p-2 whitespace-nowrap">Section</th>
                <th className="p-2 whitespace-nowrap">Year</th>
                <th className="p-2 whitespace-nowrap">Roll No</th>
                <th className="p-2 whitespace-nowrap">ID Number</th>
                <th className="p-2 whitespace-nowrap">Phone</th>
                <th className="p-2 whitespace-nowrap">Reason/Status</th>
                <th className="p-2 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r._id} className="border-t">
                  <td className="p-2"><input type="checkbox" checked={selected.includes(r._id)} onChange={e => setSelected(e.target.checked ? [...selected, r._id] : selected.filter(id => id !== r._id))} /></td>
                  <td className="p-2 whitespace-nowrap text-center">{r.name}</td>
                  <td className="p-2 whitespace-nowrap text-center">{r.email}</td>
                  <td className="p-2 whitespace-nowrap text-center">{r.section}</td>
                  <td className="p-2 whitespace-nowrap text-center">{r.year}</td>
                  <td className="p-2 whitespace-nowrap text-center">{r.rollNo}</td>
                  <td className="p-2 whitespace-nowrap text-center">{r.idNumber}</td>
                  <td className="p-2 whitespace-nowrap text-center">{r.phone}</td>
                  <td className="p-2 whitespace-nowrap text-center">{r.status === 'rejected' ? (r.rejectionReason || 'N/A') : (r.status === 'approved' ? 'Approved' : 'Pending')}</td>
                  <td className="p-2 whitespace-nowrap text-center">
  <div className="flex gap-2 min-w-[220px]">
    <button className="flex-1 bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50" disabled={actionLoading===r._id} onClick={() => handleApprove(r._id)}>Approve</button>
    <button className="flex-1 bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50" disabled={actionLoading===r._id} onClick={() => handleReject(r._id)}>Reject</button>
    <button className="flex-1 bg-yellow-500 text-white px-2 py-1 rounded disabled:opacity-50" disabled={actionLoading===r._id} onClick={() => setEditRequest({ ...r })}>Edit</button>
  </div>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && requests.length === 0 && <div className="mt-4">No pending requests.</div>}
      {/* Edit Modal */}
      {editRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl" onClick={() => setEditRequest(null)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Edit Registration Request</h2>
            <form onSubmit={async e => {
              e.preventDefault();
              setActionLoading('edit-'+editRequest._id);
              try {
                await apiRequest(`/student-registration/requests/${editRequest._id}`, {
                  method: 'PUT',
                  body: JSON.stringify(editRequest)
                });
                fetchRequests();
                setEditRequest(null);
                window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Request updated successfully!', type: 'success' } }));
              } catch (err) {
                window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message || 'Update failed', type: 'error' } }));
              }
              setActionLoading(null);
            }} className="space-y-3">
              <input className="w-full border rounded px-3 py-2" name="name" value={editRequest.name} onChange={e => setEditRequest({ ...editRequest, name: e.target.value })} placeholder="Name" required />
              <input className="w-full border rounded px-3 py-2" name="email" value={editRequest.email} onChange={e => setEditRequest({ ...editRequest, email: e.target.value })} placeholder="Email" required type="email" />
              <input className="w-full border rounded px-3 py-2" name="section" value={editRequest.section} onChange={e => setEditRequest({ ...editRequest, section: e.target.value })} placeholder="Section" required />
              <input className="w-full border rounded px-3 py-2" name="year" value={editRequest.year} onChange={e => setEditRequest({ ...editRequest, year: e.target.value })} placeholder="Year" required />
              <input className="w-full border rounded px-3 py-2" name="rollNo" value={editRequest.rollNo} onChange={e => setEditRequest({ ...editRequest, rollNo: e.target.value })} placeholder="Roll No" required />
              <input className="w-full border rounded px-3 py-2" name="idNumber" value={editRequest.idNumber} onChange={e => setEditRequest({ ...editRequest, idNumber: e.target.value })} placeholder="ID Number" required />
              <input className="w-full border rounded px-3 py-2" name="phone" value={editRequest.phone} onChange={e => setEditRequest({ ...editRequest, phone: e.target.value })} placeholder="Phone" />
              <div className="flex gap-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700" type="submit" disabled={actionLoading===('edit-'+editRequest._id)}>Save</button>
                <button className="bg-gray-400 text-white px-4 py-2 rounded font-bold hover:bg-gray-500" type="button" onClick={() => setEditRequest(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
