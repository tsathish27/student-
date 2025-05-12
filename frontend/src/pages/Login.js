import React, { useState } from 'react';
import { apiRequest } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = 'Invalid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        // Save token and user info
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        setErrors({}); // Clear errors on successful login
        // Show notification
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Login successful!', type: 'success' } }));
        // Redirect based on role
        if (res.user.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/student';
        }
      } catch (err) {
        // Only show error if login failed
        setErrors({ general: err.message || 'Login failed' });
      }
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h2 className="text-3xl font-bold mb-6 text-primary">Login</h2>
      {errors.general && (
        <div className="mb-4 flex items-center gap-2 bg-error/10 border border-error text-error px-4 py-2 rounded-xl animate-fade-in relative">
          <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
          <span className="text-sm font-medium">{errors.general}</span>
          <button type="button" className="absolute right-2 top-2 text-error hover:text-error/60" onClick={() => setErrors(e => ({ ...e, general: undefined }))} aria-label="Dismiss error">&times;</button>
        </div>
      )}
      <form className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border" onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <input
            className={`block w-full p-2 border rounded ${errors.email ? 'border-red-500' : ''}`}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
          />
          {errors.email && (
  <div className="flex items-center gap-2 bg-red-50 border border-red-400 text-red-700 px-3 py-1 rounded mt-1 animate-fade-in">
    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
    <span className="text-xs font-medium">{errors.email}</span>
  </div>
)}
        </div>
        <div className="mb-6 relative">
          <input
            className={`block w-full p-2 border rounded pr-10 ${errors.password ? 'border-red-500' : ''}`}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-2 text-gray-500 hover:text-gray-800 focus:outline-none"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-10.5-7.5a10.05 10.05 0 012.6-4.368m1.38-1.38A9.953 9.953 0 0112 5c5 0 9.27 3.11 10.5 7.5-.489 1.74-1.438 3.312-2.6 4.368M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7.5 0C21.27 7.61 17 4.5 12 4.5c-1.22 0-2.4.17-3.5.5m-6 7c1.23 4.39 5.5 7.5 10.5 7.5 1.22 0 2.4-.17 3.5-.5" /></svg>
            )}
          </button>
          {errors.password && (
  <div className="flex items-center gap-2 bg-red-50 border border-red-400 text-red-700 px-3 py-1 rounded mt-1 animate-fade-in">
    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
    <span className="text-xs font-medium">{errors.password}</span>
  </div>
)}
        </div>
        <button className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark transition">Login</button>
      </form>
      <div className="mt-4 text-center">
        <a href="/registration-status" className="text-indigo-600 hover:underline font-medium">Waiting for approval? Check your registration status</a>
      </div>
    </div>
  );
}
