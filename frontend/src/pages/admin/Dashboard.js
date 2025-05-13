import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

function DashboardCard({ icon, label, value, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} text-white rounded-2xl shadow-lg flex flex-col items-center justify-center transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group min-w-[200px] min-h-[200px] w-[220px] h-[220px] m-2`}>
      <div className="mb-2 group-hover:animate-bounce">{icon}</div>
      <div className="text-3xl font-extrabold drop-shadow mb-1">{value}</div>
      <div className="text-lg font-semibold tracking-wide uppercase opacity-90">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiRequest('/admin/dashboard/stats');
        setStats(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    apiRequest('/student-registration/requests')
      .then(res => setPendingRequests(Array.isArray(res) ? res.length : 0))
      .catch(() => setPendingRequests(0));
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-dark mb-4 drop-shadow">Welcome, Admin!</h2>
      </div>
      {loading && <div className="text-primary animate-pulse text-center">Loading...</div>}
      {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
      <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 mt-8">
        <DashboardCard
          icon={<svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0 0H7m5 0h5" /></svg>}
          label="Students"
          value={stats?.students ?? 0}
          color="from-blue-500 to-blue-700"
        />
        <DashboardCard
          icon={<svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>}
          label="Assignments/Quizzes"
          value={stats?.quizzes ?? 0}
          color="from-pink-500 to-pink-700"
        />
        <DashboardCard
          icon={<svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405M19 13V7a2 2 0 0 0-2-2h-2.586a1 1 0 0 1-.707-.293l-1.414-1.414a1 1 0 0 0-.707-.293H9a2 2 0 0 0-2 2v6" /></svg>}
          label="Notifications"
          value={stats?.notifications ?? 0}
          color="from-yellow-400 to-yellow-600"
        />
        <DashboardCard
          icon={<svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 17l-5-5 5-5 5 5 5-5 5 5" /></svg>}
          label="Subjects"
          value={stats?.subjects ?? 0}
          color="from-green-500 to-green-700"
        />
        <DashboardCard
          icon={<svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 17l-5-5 5-5 5 5 5-5 5 5" /></svg>}
          label="Reports"
          value={stats?.reports ?? 0}
          color="from-purple-500 to-purple-700"
        />
        <DashboardCard
          icon={<svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 10h.01M12 14h.01M16 10h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>}
          label="Requests"
          value={pendingRequests}
          color="from-orange-400 to-orange-600"
        />
      </div>
    </div>
  );
}
