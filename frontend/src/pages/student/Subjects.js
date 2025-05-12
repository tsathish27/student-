import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

export default function StudentSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    apiRequest('/subject/my')
      .then(setSubjects)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Subjects</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {subjects.length > 0 ? (
        <table className="w-full border mt-4 text-sm rounded-xl shadow-lg bg-white overflow-x-auto">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="bg-gray-100">
              <th className="p-2 text-center">Name</th>
              <th className="p-2 text-center">Code</th>
              <th className="p-2 text-center">Year</th>
              <th className="p-2 text-center">Semester</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(s => (
              <tr key={s._id} className="border-t hover:bg-blue-50 transition-all">
                <td className="p-2 text-center">{s.name}</td>
                <td className="p-2 text-center">{s.code}</td>
                <td className="p-2 text-center">{s.year}</td>
                <td className="p-2 text-center">{s.semester}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <div className="text-gray-600">No subjects found.</div>
      )}
    </div>
  );
}