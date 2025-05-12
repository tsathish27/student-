import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const studentLinks = [
  { label: 'Dashboard', to: '/student' },
  { label: 'Profile', to: '/student/profile' },
  { label: 'Attendance', to: '/student/attendance' },
  { label: 'Marks', to: '/student/marks' },
  { label: 'Quizzes', to: '/student/quizzes' },
  { label: 'Reports', to: '/student/reports' },
  { label: 'Notifications', to: '/student/notifications' },
];

export default function StudentLayout({ children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white shadow-lg border-r border-blue-100 py-8 px-4 flex flex-col gap-2">
        <h2 className="text-2xl font-extrabold text-blue-600 mb-6">Student</h2>
        {studentLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-4 py-2 rounded-lg font-medium text-left transition-all ${location.pathname === link.to ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700 hover:bg-blue-50'}`}
          >
            {link.label}
          </Link>
        ))}
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 pt-24">
        {children}
      </main>
    </div>
  );
}
