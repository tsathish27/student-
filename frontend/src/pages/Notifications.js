import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    apiRequest('/notification/my')
      .then(setNotifications)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="text-gray-500">No notifications found.</div>
      ) : (
        <ul className="space-y-4">
          {notifications.map(n => (
            <li key={n._id} className={`border-l-4 p-4 bg-white shadow rounded ${
              n.type === 'info' ? 'border-blue-400' :
              n.type === 'success' ? 'border-green-400' :
              n.type === 'warning' ? 'border-yellow-400' :
              n.type === 'error' ? 'border-red-400' : 'border-gray-300'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold capitalize text-sm text-gray-700">{n.type}</span>
                <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-gray-900">{n.message}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
