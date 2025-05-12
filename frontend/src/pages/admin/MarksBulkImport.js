import React, { useState } from 'react';

export default function MarksBulkImport({ onSuccess }) {
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(null); // Holds dryRunCreate array
  const [pendingFile, setPendingFile] = useState(null); // Holds the file for re-upload
  const [showSchema, setShowSchema] = useState(false);

  // Robust bulk marks import handler
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
      console.log('[MarksBulkImport] Sending file:', file, 'confirmUpdate:', confirmUpdate);
      const res = await fetch(`/api/import/marks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      console.log('[MarksBulkImport] Response:', data);
      // Handle dry run preview
      if (!confirmUpdate && data.status === 'dryrun' && data.toCreate && data.toCreate.length > 0) {
        setPendingCreate(data.toCreate);
        setPendingFile(file);
        setLoading(false);
        return;
      }
      if (data.status === 'success') {
        setMsg('Bulk marks import successful!');
        setError('');
        setPendingCreate(null);
        setPendingFile(null);
        if (data.notifications && data.notifications.length > 0) {
          window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: data.notifications.map(n => n.message).join('\n'), type: 'info' } }));
        }
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Bulk marks import successful!', type: 'success' } }));
        if (onSuccess) onSuccess();
      } else {
        // Show detailed backend errors/skipped rows if present
        let errorMsg = data.message || 'Import failed.';
        if (data.errors && data.errors.length > 0) {
          errorMsg += '\n' + data.errors.map(e => `Row ${e.row}: ${e.reason}`).join('\n');
        }
        if (data.skipped) {
          errorMsg += `\n${data.skipped} rows skipped.`;
        }
        setError(errorMsg);
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: errorMsg, type: 'error' } }));
      }
    } catch (err) {
      setError('Bulk import failed. Please check your file and try again.');
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Bulk import failed. Please check your file and try again.', type: 'error' } }));
      console.error('[MarksBulkImport] Exception:', err);
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
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Bulk import cancelled. No new records were created.', type: 'info' } }));
  };

  return (
    <div className="mb-4">
      <div className="mb-2">
        <button
          type="button"
          className={`flex items-center w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-t shadow hover:from-purple-600 focus:outline-none transition-all duration-200 ${showSchema ? '' : 'rounded-b'}`}
          onClick={() => setShowSchema((v) => !v)}
        >
          {showSchema ? 'Hide' : 'Show'} Excel Format & Example
        </button>
        {showSchema && (
          <div className="bg-white border border-gray-200 rounded-b shadow p-4 text-sm">
            <div className="font-semibold mb-1">Excel Columns Required:</div>
            <table className="w-full text-xs border mb-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">ID Number</th>
                  <th className="border px-2 py-1">Subject</th>
                  <th className="border px-2 py-1">Assessment Type</th>
                  <th className="border px-2 py-1">Score</th>
                  <th className="border px-2 py-1">Max Score</th>
                  <th className="border px-2 py-1">Date</th>
                  <th className="border px-2 py-1">Semester</th>
                  <th className="border px-2 py-1">Year</th>
                  <th className="border px-2 py-1">Section</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1">N190001</td>
                  <td className="border px-2 py-1">C&LA</td>
                  <td className="border px-2 py-1">AT 1</td>
                  <td className="border px-2 py-1">18</td>
                  <td className="border px-2 py-1">20</td>
                  <td className="border px-2 py-1">2025-05-01</td>
                  <td className="border px-2 py-1">sem1</td>
                  <td className="border px-2 py-1">E-1</td>
                  <td className="border px-2 py-1">CSE-01</td>
                </tr>
              </tbody>
            </table>
            <div className="text-xs text-gray-500 mb-2 text-left">
              • <b>Date</b>: Format YYYY-MM-DD<br />
              • <b>Section</b>: e.g. CSE-01<br />
              • <b>Year</b>: e.g. E-1<br />
              • <b>Semester</b>: sem1 or sem2<br />
              • <b>Subject</b>: Must match a subject name or code<br />
              • <b>ID Number</b>: Unique student ID<br />
              • <b>Assessment Type</b>: AT 1, AT 2, AT 3, AT 4, MID 1, MID 2, MID 3, Others<br />
              • <b>Score</b> and <b>Max Score</b>: Numbers<br />
            </div>
          </div>
        )}
      </div>
      <label className="font-semibold block mb-1 mt-2">Bulk Import Marks from Excel:</label>
      <input type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={loading} />
      {msg && <div className="mt-2 text-green-600">{msg}</div>}
      {error && <div className="mt-2 text-red-600">{error}</div>}
      {/* Modal for pending create records */}
      {pendingCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <div className="font-bold text-lg mb-2 text-yellow-700">You are about to create new marks records.</div>
            <div className="mb-2 text-gray-700 text-sm">
              The following records do not already exist in the system (no duplicates will be created).<br/>
              If you wish to proceed, click <b>Proceed</b>. Otherwise, click <b>Cancel</b>.
            </div>
            <div className="max-h-40 overflow-y-auto border rounded mb-3 bg-gray-50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">ID Number</th>
                    <th className="border px-2 py-1">Subject</th>
                    <th className="border px-2 py-1">Assessment Type</th>
                    <th className="border px-2 py-1">Score</th>
                    <th className="border px-2 py-1">Max Score</th>
                    <th className="border px-2 py-1">Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCreate.map((rec, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">{rec.idNumber}</td>
                      <td className="border px-2 py-1">{rec.subject}</td>
                      <td className="border px-2 py-1">{rec.assessmentType}</td>
                      <td className="border px-2 py-1">{rec.score}</td>
                      <td className="border px-2 py-1">{rec.maxScore}</td>
                      <td className="border px-2 py-1">{rec.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 justify-end mt-4">
              <button className="px-4 py-2 rounded bg-green-600 text-white font-semibold" onClick={handleProceedCreate}>Proceed</button>
              <button className="px-4 py-2 rounded bg-gray-400 text-white font-semibold" onClick={handleCancelCreate}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
