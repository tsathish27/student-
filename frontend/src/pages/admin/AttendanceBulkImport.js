// import React, { useState } from 'react';

// export default function AttendanceBulkImport({ onSuccess }) {
//   const [msg, setMsg] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [pendingCreate, setPendingCreate] = useState(null); // Holds dryRunCreate array
//   const [pendingFile, setPendingFile] = useState(null); // Holds the file for re-upload
//   const [showSchema, setShowSchema] = useState(false);

//   // Robust bulk attendance import handler
// const handleImport = async (e, confirmUpdate = false, fileOverride = null) => {
//   // Always use the last uploaded file for confirm step
//   const file = fileOverride || e.target?.files?.[0] || pendingFile;
//   if (!file) {
//     setError('No file selected!');
//     return;
//   }
//   setMsg('');
//   setError('');
//   setLoading(true);
//   const formData = new FormData();
//   formData.append('file', file);
//   // Add confirmUpdate as string for backend compatibility
//   if (confirmUpdate) formData.append('confirmUpdate', 'true');
//   try {
//     console.log('[BulkImport] Sending file:', file, 'confirmUpdate:', confirmUpdate);
//     const res = await fetch(`/api/import/attendance`, {
//       method: 'POST',
//       headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
//       body: formData
//     });
//     const data = await res.json();
//     console.log('[BulkImport] Response:', data);
//     // Handle dry run preview
//     if (!confirmUpdate && data.status === 'dryrun' && data.toCreate && data.toCreate.length > 0) {
//       setPendingCreate(data.toCreate);
//       setPendingFile(file); // Don't clear pendingFile until after confirm/cancel
//       setLoading(false);
//       return;
//     }
//     if (data.status === 'success') {
//       setMsg('Bulk attendance import successful!');
//       setError('');
//       setPendingCreate(null);
//       setPendingFile(null);
//       // Show backend notifications if any
//       if (data.notifications && data.notifications.length > 0) {
//         window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: data.notifications.map(n => n.message).join('\n'), type: 'info' } }));
//       }
//       window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Bulk attendance import successful!', type: 'success' } }));
//       if (onSuccess) onSuccess();
//     } else {
//       // Show detailed backend errors/skipped rows if present
//       let errorMsg = data.message || 'Import failed.';
//       if (data.errors && data.errors.length > 0) {
//         errorMsg += '\n' + data.errors.map(e => `Row ${e.row}: ${e.reason}`).join('\n');
//       }
//       if (data.skipped) {
//         errorMsg += `\n${data.skipped} rows skipped.`;
//       }
//       setError(errorMsg);
//       window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: errorMsg, type: 'error' } }));
//     }
//   } catch (err) {
//     setError('Bulk import failed. Please check your file and try again.');
//     window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Bulk import failed. Please check your file and try again.', type: 'error' } }));
//     console.error('[BulkImport] Exception:', err);
//   } finally {
//     setLoading(false);
//   }
// };

//   // Proceed with confirmUpdate, always use the last uploaded file
// const handleProceedCreate = () => {
//   if (!pendingFile) {
//     setError('No file to confirm. Please re-upload.');
//     return;
//   }
//   handleImport({}, true, pendingFile);
// };

//   const handleCancelCreate = () => {
//     setPendingCreate(null);
//     setPendingFile(null);
//     setMsg('Bulk import cancelled. No new records were created.');
//     window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Bulk import cancelled. No new records were created.', type: 'info' } }));
//   };

//   return (
//     <div className="mb-4">
//       <div className="mb-2">
//         <button
//           type="button"
//           className={`flex items-center w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-t shadow hover:from-blue-600 focus:outline-none transition-all duration-200 ${showSchema ? '' : 'rounded-b'}`}
//           onClick={() => setShowSchema((v) => !v)}
//           aria-expanded={showSchema}
//         >
//           <svg className={`w-5 h-5 mr-2 transform transition-transform duration-200 ${showSchema ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
//           </svg>
//           Excel File Format & Example (Click to {showSchema ? 'Hide' : 'Show'})
//         </button>
//         <div
//           className={`overflow-hidden bg-white border border-blue-200 rounded-b shadow transition-all duration-300 ${showSchema ? 'max-h-[600px] opacity-100 py-4 px-4' : 'max-h-0 opacity-0 py-0 px-4'}`}
//           style={{ transitionProperty: 'max-height, opacity, padding' }}
//         >
//           {showSchema && (
//             <>
//               <table className="border mb-2 w-full text-center">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border px-2 py-1">Date</th>
//                     <th className="border px-2 py-1">Section</th>
//                     <th className="border px-2 py-1">Year</th>
//                     <th className="border px-2 py-1">Semester</th>
//                     <th className="border px-2 py-1">Subject</th>
//                     <th className="border px-2 py-1">ID Number</th>
//                     <th className="border px-2 py-1">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td className="border px-2 py-1">2025-05-01</td>
//                     <td className="border px-2 py-1">CSE-01</td>
//                     <td className="border px-2 py-1">E-1</td>
//                     <td className="border px-2 py-1">sem1</td>
//                     <td className="border px-2 py-1">C&LA</td>
//                     <td className="border px-2 py-1">N190001</td>
//                     <td className="border px-2 py-1">Present / Absent</td>
//                   </tr>
//                 </tbody>
//               </table>
//               <div className="text-xs text-gray-500 mb-2 text-left">
//                 • <b>Date</b>: Format YYYY-MM-DD<br />
//                 • <b>Section</b>: e.g. CSE-01<br />
//                 • <b>Year</b>: e.g. E-1<br />
//                 • <b>Semester</b>: sem1 or sem2<br />
//                 • <b>Subject</b>: Must match a subject name or code<br />
//                 • <b>ID Number</b>: Unique student ID<br />
//                 • <b>Status</b>: Present or Absent<br />
//                 <span className="text-red-600">• Attendance for future dates is not allowed.</span>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//       <label className="font-semibold block mb-1 mt-2">Bulk Import Attendance from Excel:</label>
//       <input type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={loading} />
//       {msg && <div className="mt-2 text-green-600">{msg}</div>}
//       {error && <div className="mt-2 text-red-600">{error}</div>}
//       {/* Modal for pending create records */}
//       {pendingCreate && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
//           <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
//             <div className="font-bold text-lg mb-2 text-yellow-700">You are about to create new attendance records.</div>
//             <div className="mb-2 text-gray-700 text-sm">
//               The following records do not already exist in the system (no duplicates will be created).<br/>
//               If you wish to proceed, click <b>Proceed</b>. Otherwise, click <b>Cancel</b>.
//             </div>
//             <div className="max-h-40 overflow-y-auto border rounded mb-3 bg-gray-50">
//               <table className="w-full text-xs">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border px-2 py-1">ID Number</th>
//                     {pendingCreate[0]?.date && <th className="border px-2 py-1">Date</th>}
//                     {pendingCreate[0]?.subject && <th className="border px-2 py-1">Subject</th>}
//                     {pendingCreate[0]?.semester && <th className="border px-2 py-1">Semester</th>}
//                     {pendingCreate[0]?.status && <th className="border px-2 py-1">Status</th>}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {pendingCreate.map((rec, i) => (
//                     <tr key={i}>
//                       <td className="border px-2 py-1">{rec.idNumber}</td>
//                       {rec.date && <td className="border px-2 py-1">{rec.date.slice(0,10)}</td>}
//                       {rec.subject && <td className="border px-2 py-1">{rec.subject}</td>}
//                       {rec.semester && <td className="border px-2 py-1">{rec.semester}</td>}
//                       {rec.status && <td className="border px-2 py-1">{rec.status}</td>}
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//             <div className="flex gap-4 justify-end mt-4">
//               <button className="px-4 py-2 rounded bg-green-600 text-white font-semibold" onClick={handleProceedCreate}>Proceed</button>
//               <button className="px-4 py-2 rounded bg-gray-400 text-white font-semibold" onClick={handleCancelCreate}>Cancel</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
import React, { useState } from 'react';

export default function AttendanceBulkImport({ onSuccess }) {
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [showSchema, setShowSchema] = useState(false);

  const handleImport = async (e, confirmUpdate = false, fileOverride = null) => {
    const file = fileOverride || e.target?.files?.[0] || pendingFile;
    if (!file) {
      setError('No file selected!');
      return;
    }

    setMsg('');
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    if (confirmUpdate) formData.append('confirmUpdate', 'true');

    try {
      const res = await fetch(`/api/import/attendance`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      const data = await res.json();

      if (!confirmUpdate && data.status === 'dryrun' && data.toCreate?.length > 0) {
        setPendingCreate(data.toCreate);
        setPendingFile(file);
        setLoading(false);
        return;
      }

      if (data.status === 'success') {
        setMsg('Bulk attendance import successful!');
        setError('');
        setPendingCreate(null);
        setPendingFile(null);
        if (data.notifications?.length > 0) {
          window.dispatchEvent(new CustomEvent('app-toast', {
            detail: { message: data.notifications.map(n => n.message).join('\n'), type: 'info' }
          }));
        }
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { message: 'Bulk attendance import successful!', type: 'success' }
        }));
        onSuccess?.();
      } else {
        let errorMsg = data.message || 'Import failed.';
        if (data.errors?.length > 0) {
          errorMsg += '\n' + data.errors.map(e => `Row ${e.row}: ${e.reason}`).join('\n');
        }
        if (data.skipped) {
          errorMsg += `\n${data.skipped} rows skipped.`;
        }
        setError(errorMsg);
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { message: errorMsg, type: 'error' }
        }));
      }
    } catch (err) {
      setError('Bulk import failed. Please check your file and try again.');
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: 'Bulk import failed. Please check your file and try again.', type: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleProceedCreate = () => {
    if (!pendingFile) {
      setError('No file to confirm. Please re-upload.');
      return;
    }
    handleImport({}, true, pendingFile);
  };

  const handleCancelCreate = () => {
    setPendingCreate(null);
    setPendingFile(null);
    setMsg('Bulk import cancelled. No new records were created.');
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { message: 'Bulk import cancelled. No new records were created.', type: 'info' }
    }));
  };

  return (
    <div className="mb-6 px-4">
      {/* Schema Toggle */}
      <div className="mb-2">
        <button
          type="button"
          className={`flex items-center w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-t shadow hover:from-blue-600 focus:outline-none transition-all duration-200 ${showSchema ? '' : 'rounded-b'}`}
          onClick={() => setShowSchema(v => !v)}
        >
          <svg className={`w-5 h-5 mr-2 transform transition-transform duration-200 ${showSchema ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Excel File Format & Example (Click to {showSchema ? 'Hide' : 'Show'})
        </button>

        <div className={`transition-all duration-300 bg-white border border-blue-200 rounded-b shadow ${showSchema ? 'max-h-[600px] opacity-100 py-4 px-4' : 'max-h-0 opacity-0 py-0 px-4'}`}>
          {showSchema && (
            <>
              <div className="overflow-auto">
                <table className="border mb-2 w-full text-sm text-center">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1">Date</th>
                      <th className="border px-2 py-1">Section</th>
                      <th className="border px-2 py-1">Year</th>
                      <th className="border px-2 py-1">Semester</th>
                      <th className="border px-2 py-1">Subject</th>
                      <th className="border px-2 py-1">ID Number</th>
                      <th className="border px-2 py-1">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border px-2 py-1">2025-05-01</td>
                      <td className="border px-2 py-1">CSE-01</td>
                      <td className="border px-2 py-1">E-1</td>
                      <td className="border px-2 py-1">sem1</td>
                      <td className="border px-2 py-1">C&LA</td>
                      <td className="border px-2 py-1">N190001</td>
                      <td className="border px-2 py-1">Present / Absent</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-gray-600 text-left">
                • <b>Date</b>: Format YYYY-MM-DD<br />
                • <b>Section</b>: e.g. CSE-01<br />
                • <b>Year</b>: e.g. E-1<br />
                • <b>Semester</b>: sem1 or sem2<br />
                • <b>Subject</b>: Must match a subject name or code<br />
                • <b>ID Number</b>: Unique student ID<br />
                • <b>Status</b>: Present or Absent<br />
                <span className="text-red-600">• Attendance for future dates is not allowed.</span>
              </div>
              <a
                href="/api/sample/attendance-template.xlsx"
                className="inline-block mt-3 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700"
                download
              >
                Download Template
              </a>
            </>
          )}
        </div>
      </div>

      {/* File Input */}
      <label className="block font-semibold mb-1 mt-4">Bulk Import Attendance from Excel:</label>
      <input type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={loading} className="block w-full" />

      {/* Status Messages */}
      {msg && <div className="mt-2 text-green-600 text-sm">{msg}</div>}
      {error && <div className="mt-2 text-red-600 whitespace-pre-wrap text-sm">{error}</div>}

      {/* Confirmation Modal */}
      {pendingCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
            <div className="text-lg font-bold mb-2 text-yellow-700">Confirm Attendance Creation</div>
            <div className="mb-3 text-sm text-gray-700">
              You're about to create <b>{pendingCreate.length}</b> new attendance records. Proceed?
            </div>
            <div className="max-h-48 overflow-y-auto border rounded mb-4 bg-gray-50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">ID Number</th>
                    {pendingCreate[0]?.date && <th className="border px-2 py-1">Date</th>}
                    {pendingCreate[0]?.subject && <th className="border px-2 py-1">Subject</th>}
                    {pendingCreate[0]?.semester && <th className="border px-2 py-1">Semester</th>}
                    {pendingCreate[0]?.status && <th className="border px-2 py-1">Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {pendingCreate.map((rec, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">{rec.idNumber}</td>
                      {rec.date && <td className="border px-2 py-1">{rec.date.slice(0, 10)}</td>}
                      {rec.subject && <td className="border px-2 py-1">{rec.subject}</td>}
                      {rec.semester && <td className="border px-2 py-1">{rec.semester}</td>}
                      {rec.status && <td className="border px-2 py-1">{rec.status}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={handleCancelCreate} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">Cancel</button>
              <button onClick={handleProceedCreate} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded">Proceed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
