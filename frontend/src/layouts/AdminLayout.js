import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const adminLinks = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Students', to: '/admin/students' },
  { label: 'Attendance', to: '/admin/attendance' },
  { label: 'Marks', to: '/admin/marks' },
  { label: 'Quizzes', to: '/admin/quizzes' },
  { label: 'Subjects', to: '/admin/subjects' },
  { label: 'Reports', to: '/admin/reports' },
  { label: 'Notifications', to: '/admin/notifications' },
  { label: 'Student Requests', to: '/admin/StudentRequests' }
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white shadow-lg border-r border-blue-100 py-8 px-4 flex flex-col gap-2">
        <h2 className="text-2xl font-extrabold text-indigo-600 mb-6">Admin</h2>
        {adminLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-4 py-2 rounded-lg font-medium text-left transition-all ${location.pathname === link.to ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-700 hover:bg-indigo-50'}`}
          >
            {link.label}
          </Link>
        ))}
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 pt-24">
        {/* {process.env.NODE_ENV === 'development' && (
          <div style={{ background: '#ffeeba', color: '#856404', padding: '8px', marginBottom: '16px', borderRadius: '6px', fontSize: '14px' }}>
            <strong>AdminLayout debug:</strong> Rendering {children && children.type ? children.type.name || children.type.displayName || typeof children.type : typeof children}
          </div>
        )} */}
        {children}
      </main>
    </div>
  );
}
