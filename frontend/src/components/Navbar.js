import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function fetchPendingRequests() {
      if (user && user.role === 'admin') {
        try {
          const res = await apiRequest('/student-registration/requests');
          if (typeof window !== 'undefined') {
            window.__pendingStudentRequests = Array.isArray(res) ? res.length : 0;
            window.dispatchEvent(new CustomEvent('pending-student-requests-update'));
          }
        } catch (e) {
          if (typeof window !== 'undefined') {
            window.__pendingStudentRequests = 0;
            window.dispatchEvent(new CustomEvent('pending-student-requests-update'));
          }
        }
      }
    }
    fetchPendingRequests();
  }, [user]);

  const handleLogout = () => {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Logged out successfully!', type: 'success' } }));
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 shadow-xl border-b border-blue-200 rounded-b-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-full text-white font-bold">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M22 7.42l-10-4.19-10 4.19 10 4.18 10-4.18z" fill="#6366f1" />
              <path d="M6 10.6V16a2 2 0 002 2h8a2 2 0 002-2v-5.4" fill="#fff" />
              <path d="M6 10.6V16a2 2 0 002 2h8a2 2 0 002-2v-5.4" stroke="#6366f1" />
              <path d="M12 21v-7" stroke="#6366f1" />
            </svg>
          </span>
          <Link to="/" className="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-blue-400 to-cyan-400 drop-shadow-md hover:from-indigo-600 hover:to-cyan-500 transition-colors">
            Student Management
          </Link>
        </div>

        {/* Hamburger Icon */}
        <div className="sm:hidden">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="focus:outline-none">
            <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation - Desktop */}
        <div className="hidden sm:flex items-center gap-4">
          <NavLinks user={user} handleLogout={handleLogout} />
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="sm:hidden px-4 pb-4 flex flex-col gap-3">
          <NavLinks user={user} handleLogout={handleLogout} isMobile />
        </div>
      )}
    </nav>
  );
}

// Nav Links Component
function NavLinks({ user, handleLogout, isMobile = false }) {
  const baseClass = "text-sm px-4 py-1.5 rounded-full transition-all font-medium";
  const mobileExtra = isMobile ? "bg-gray-100 w-full text-center" : "";

  return (
    <>
      <Link to="/about" className={`${baseClass} text-gray-700 hover:text-indigo-700 hover:bg-indigo-100 ${mobileExtra}`}>About</Link>

      {!user && (
        <>
          <Link to="/login" className={`${baseClass} text-white bg-gradient-to-r from-indigo-500 to-blue-400 hover:from-indigo-600 hover:to-blue-500 shadow ${mobileExtra}`}>Login</Link>
          <Link to="/register" className={`${baseClass} text-white bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 shadow font-semibold ${mobileExtra}`}>Register</Link>
        </>
      )}

      {user && user.role === 'admin' && (
        <Link to="/admin/StudentRequests" className={`${baseClass} text-blue-700 hover:text-white hover:bg-blue-500 font-semibold relative ${mobileExtra}`}>
          Student Requests
          <PendingStudentRequestsBadge />
        </Link>
      )}

      {user && (
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-col items-start' : ''}`}>
          <div className="w-9 h-9 bg-gradient-to-r from-indigo-200 to-cyan-100 text-indigo-700 rounded-full flex items-center justify-center font-bold uppercase shadow">
            {user.name ? user.name[0] : '?'}
          </div>
          <span className={`${isMobile ? 'text-sm mt-1' : 'hidden md:block text-sm'} font-semibold text-gray-700`}>{user.name}</span>
          <LogoutButton handleLogout={handleLogout} isMobile={isMobile} />
        </div>
      )}
    </>
  );
}

// Logout Button
const LogoutButton = ({ handleLogout, isMobile }) => (
  <button
    onClick={handleLogout}
    className={`text-sm px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow font-semibold transition-all ${isMobile ? 'w-full text-center mt-2' : ''}`}
  >
    Logout
  </button>
);

// Badge
function PendingStudentRequestsBadge() {
  const [pending, setPending] = React.useState(typeof window !== 'undefined' && window.__pendingStudentRequests || 0);
  React.useEffect(() => {
    function update() {
      setPending(window.__pendingStudentRequests || 0);
    }
    window.addEventListener('pending-student-requests-update', update);
    return () => window.removeEventListener('pending-student-requests-update', update);
  }, []);
  if (pending > 0) {
    return <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs px-2 py-0.5 animate-bounce shadow">{pending}</span>;
  }
  return null;
}
