import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function StudentNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchNotifications = async () => {
    if (!user || !user._id) return;
    setLoading(true);
    setError('');
    try {
      // Fetch student profile first to get student._id
      const student = await apiRequest('/student/my');
      if (!student || !student._id) throw new Error('Student profile not found');
      const res = await apiRequest(`/notification/${student._id}`);
      setNotifications(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  const markAsRead = async id => {
    setMsg('');
    try {
      await apiRequest(`/notification/${id}/read`, { method: 'POST' });
      setMsg('Notification marked as read.');
      fetchNotifications();
    } catch (err) {
      setMsg('Failed to mark as read.');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Notifications</h2>
      {msg && <div className="mb-2 text-green-600">{msg}</div>}
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {notifications.length > 0 && (
        <button
          className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={async () => {
            try {
              await apiRequest('/notification/read-all', { method: 'PATCH' });
              // Mark all notifications as read in the UI
              setNotifications(notifications.map(n => ({ ...n, read: true })));
            } catch (err) {
              // Optionally show error
              // setError('Failed to mark all as read');
            }
          }}
        >
          Mark All as Read
        </button>
      )}
      {notifications.length > 0 ? (
        <table className="w-full border mt-4 text-sm rounded-xl shadow-lg bg-white overflow-x-auto">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="bg-gray-100">
              <th className="p-2 text-center">Message</th>
              <th className="p-2 text-center">Type</th>
              <th className="p-2 text-center">Read</th>
              <th className="p-2 text-center">Created At</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map(n => (
              <tr key={n._id} className={"border-t hover:bg-blue-50 transition-all " + (n.read ? "bg-gray-50" : "") }>
                <td className="p-2 text-center">{n.message}</td>
                <td className="p-2 text-center">{n.type}</td>
                <td className="p-2 text-center">{n.read ? 'Yes' : 'No'}</td>
                <td className="p-2 text-center">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</td>
                <td className="p-2 text-center">
                  {!n.read && (
                    <button
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                      onClick={() => markAsRead(n._id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <div className="text-gray-600">No notifications found.</div>
      )}
    </div>
  );
}
