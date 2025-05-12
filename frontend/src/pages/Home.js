import React from 'react';
import { TypeAnimation } from 'react-type-animation';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDashboard = () => {
    if (!user) return;
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'student') navigate('/student');
    else navigate('/');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center py-8 px-2">
      <div className="relative w-screen min-w-full flex flex-col items-center justify-center min-h-[60vh] py-20 mb-12 overflow-hidden">
        {/* SVG Background */}
        <svg
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 1440 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hero-gradient" x1="0" y1="0" x2="1440" y2="500" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="1" stopColor="#38bdf8" stopOpacity="0.13" />
            </linearGradient>
          </defs>
          <path d="M0,320 C480,480 960,160 1440,320 L1440,500 L0,500 Z" fill="url(#hero-gradient)" />
          <circle cx="1200" cy="100" r="90" fill="#a5b4fc" fillOpacity="0.18" />
          <circle cx="300" cy="80" r="60" fill="#38bdf8" fillOpacity="0.12" />
        </svg>

        {/* Heading + Typing Animation */}
        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-blue-400 to-cyan-400 drop-shadow-lg">
            Student Management System
          </h1>

          <TypeAnimation
            sequence={[
              'Empowering students...',
              2000,
              'Empowering admins...',
              2000,
              'For a brighter academic journey!',
              2000,
            ]}
            wrapper="p"
            speed={50}
            repeat={Infinity}
            className="text-xl sm:text-2xl text-gray-700 mb-8 font-medium"
          />

          <div className="flex flex-row gap-4 justify-center">
            {user ? (
              <button
                onClick={handleDashboard}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-400 hover:from-indigo-600 hover:to-blue-500 text-white rounded-full shadow-xl text-lg font-semibold transition-all duration-200"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <a
                  href="/login"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-400 hover:from-indigo-600 hover:to-blue-500 text-white rounded-full shadow-xl text-lg font-semibold transition-all duration-200"
                >
                  Login
                </a>
                <a
                  href="/register"
                  className="px-8 py-3 bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white rounded-full shadow-xl text-lg font-semibold transition-all duration-200"
                >
                  Register
                </a>
              </>
            )}
          </div>
        </div>
      </div>

     {/* Features Section as Cards in a Row */}
     <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-blue-400 to-cyan-400">
        Features
      </h2>
      <div className="w-full max-w-6xl mx-auto flex flex-wrap justify-center gap-8 mt-0">
        {/* Feature 1 */}
        <div className="bg-white max-w-xs w-full rounded-2xl shadow-xl p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-2xl">
          <svg width="48" height="48" fill="none" viewBox="0 0 48 48" className="mb-3">
            <rect width="48" height="48" rx="24" fill="#e0e7ff" />
            <path d="M24 14v10l7 4" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="24" r="10" stroke="#6366f1" strokeWidth="2.2" />
          </svg>
          <h3 className="text-lg font-semibold text-indigo-600 mb-1">Easy Management</h3>
          <p className="text-gray-600">Admins can manage students, attendance, marks, and more with just a few clicks.</p>
        </div>

        {/* Feature 2 */}
        <div className="bg-white max-w-xs w-full rounded-2xl shadow-xl p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-2xl">
          <svg width="48" height="48" fill="none" viewBox="0 0 48 48" className="mb-3">
            <rect width="48" height="48" rx="24" fill="#bae6fd" />
            <path d="M20 32l4-9 4 9" stroke="#0ea5e9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="24" r="10" stroke="#0ea5e9" strokeWidth="2.2" />
          </svg>
          <h3 className="text-lg font-semibold text-blue-400 mb-1">Student Success</h3>
          <p className="text-gray-600">Track progress, analyze reports, and celebrate achievements with ease.</p>
        </div>

        {/* Feature 3 */}
        <div className="bg-white max-w-xs w-full rounded-2xl shadow-xl p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-2xl">
          <svg width="48" height="48" fill="none" viewBox="0 0 48 48" className="mb-3">
            <rect width="48" height="48" rx="24" fill="#fef9c3" />
            <path d="M24 16v8M24 32h.01M18 24h12" stroke="#f59e42" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="text-lg font-semibold text-yellow-500 mb-1">Real-Time Updates</h3>
          <p className="text-gray-600">Students and teachers get instant notifications and updates on their dashboard.</p>
        </div>

        {/* Feature 4 */}
        <div className="bg-white max-w-xs w-full rounded-2xl shadow-xl p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-2xl">
          <svg width="48" height="48" fill="none" viewBox="0 0 48 48" className="mb-3">
            <rect width="48" height="48" rx="24" fill="#bbf7d0" />
            <path d="M15 34v-2a5 5 0 015-5h8a5 5 0 015 5v2" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="20" r="5" stroke="#22c55e" strokeWidth="2.2" />
          </svg>
          <h3 className="text-lg font-semibold text-green-500 mb-1">Secure & Reliable</h3>
          <p className="text-gray-600">Your data is protected with robust security and reliable cloud infrastructure.</p>
        </div>
      </div>
    </div>
  );
}
