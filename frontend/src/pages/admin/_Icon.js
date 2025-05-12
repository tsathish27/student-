import React from 'react';

export function EyeIcon({className = ''}) {
  // Simple minimalist eye outline icon
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s4-7 10.5-7 10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} fill="none" />
    </svg>
  );
}

export function EyeOffIcon({className = ''}) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.94 17.94A10.06 10.06 0 0112 19.5c-7 0-9-7.5-9-7.5a17.92 17.92 0 013.06-4.44M6.1 6.1A9.97 9.97 0 0112 4.5c7 0 9 7.5 9 7.5a17.9 17.9 0 01-3.06 4.44M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

export function EditIcon({className = ''}) {
  // Simple minimalist pencil/pen outline icon
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 6.5l1 1a2.121 2.121 0 010 3l-8.5 8.5a2 2 0 01-.88.52l-3 1a.5.5 0 01-.63-.63l1-3a2 2 0 01.52-.88l8.5-8.5a2.121 2.121 0 013 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8l1 1" />
    </svg>
  );
}

export function TrashIcon({className = ''}) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
    </svg>
  );
}
