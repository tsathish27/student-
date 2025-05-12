import React, { useState } from 'react';
import { apiRequest } from '../api';
import { useNavigate } from 'react-router-dom';

export default function RegistrationStatus() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkStatus = async (e) => {
    e.preventDefault();
    setStatus(null);
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest(`/student-registration/status?email=${encodeURIComponent(email)}`);
      setStatus(res);
    } catch (err) {
      setError(err.message || 'Unable to fetch status.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Check Registration Status</h2>
        <form onSubmit={checkStatus} className="flex flex-col gap-4">
          <input
            type="email"
            className="border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Enter your email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded transition-all"
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </form>
        {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
        {status && (
          <div className="mt-6 text-center">
            <div className="text-lg font-semibold">Status: <span className={
              status.status === 'approved' ? 'text-green-600' : status.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
            }>{status.status.charAt(0).toUpperCase() + status.status.slice(1)}</span></div>
            {status.status === 'rejected' && status.rejectionReason && (
              <div className="mt-2 text-sm text-red-700">Reason: {status.rejectionReason}</div>
            )}
            {status.status === 'approved' && (
              <div className="mt-2 text-green-700">You can now log in with your credentials.</div>
            )}
            {status.status === 'pending' && (
              <div className="mt-2 text-yellow-700">Your registration is still under review. Please check your Mail box or spam!</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
