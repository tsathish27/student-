import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { FaUserCircle, FaEnvelope, FaPhone, FaIdBadge, FaRegAddressCard, FaHashtag, FaLayerGroup } from 'react-icons/fa';

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug: Log user object
  console.log('StudentProfile: user =', user);

  useEffect(() => {
    setLoading(true);
    setError('');
    apiRequest('/student/my')
      .then(res => {
        console.log('StudentProfile: API response =', res);
        setProfile(res);
      })
      .catch(e => {
        console.error('StudentProfile: API error =', e);
        setError(e.message || 'Unknown error');
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Helper to get initials for avatar
  const getInitials = (name) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <div className="p-6 sm:p-10 max-w-2xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-800 drop-shadow">My Profile</h2>
      {loading ? (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-xl p-8 relative text-center text-lg">Loading...</div>
      ) : error ? (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-xl p-8 relative text-red-600 text-center">{error}</div>
      ) : profile ? (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-xl p-8 relative">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-blue-200 flex items-center justify-center text-5xl text-blue-700 shadow-lg mb-2">
              {/* Avatar with initials */}
              {getInitials(profile.userId?.name || profile.name) || <FaUserCircle />}
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-1 flex items-center gap-2">
              <FaUserCircle className="inline text-blue-400" />
              {profile.userId?.name || profile.name}
            </div>
            <div className="text-gray-500 font-medium flex items-center gap-2">
              <FaEnvelope className="inline text-blue-300" />
              {profile.userId?.email || profile.email}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4">
              <FaLayerGroup className="text-blue-500" />
              <span className="font-semibold">Section:</span>
              <span>{profile.section}</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4">
              <FaRegAddressCard className="text-blue-500" />
              <span className="font-semibold">Year:</span>
              <span>{profile.year}</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4">
              <FaHashtag className="text-blue-500" />
              <span className="font-semibold">Roll No:</span>
              <span>{profile.rollNo}</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4">
              <FaIdBadge className="text-blue-500" />
              <span className="font-semibold">ID Number:</span>
              <span>{profile.idNumber}</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4">
              <FaPhone className="text-blue-500" />
              <span className="font-semibold">Phone:</span>
              <span>{profile.phone}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-xl p-8 relative text-center text-gray-600">No profile data found.</div>
      )}
    </div>
  );
}
