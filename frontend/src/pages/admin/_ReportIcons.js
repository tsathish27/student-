import React from 'react';

export function PdfIcon({className = ''}) {
  return (
    <svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#fff" stroke="#e53e3e" strokeWidth="2"/>
      <text x="7" y="16" fontSize="8" fill="#e53e3e">PDF</text>
    </svg>
  );
}


export function CsvIcon({className = ''}) {
  return (
    <svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#fff" stroke="#38a169" strokeWidth="2"/>
      <text x="7" y="16" fontSize="8" fill="#38a169">CSV</text>
    </svg>
  );
}

export function ExcelIcon({className = ''}) {
  return (
    <svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#fff" stroke="#eab308" strokeWidth="2"/>
      <text x="7" y="16" fontSize="8" fill="#eab308">XLSX</text>
    </svg>
  );
}
