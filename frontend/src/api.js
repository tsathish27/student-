// Centralized API service using unified API URL
import config from './config';

// Simple toast event system
export function showToast(message, type = 'error') {
  const event = new CustomEvent('app-toast', { detail: { message, type } });
  window.dispatchEvent(event);
}

export function joinUrls(base, path) {
  // Remove trailing slashes from base and leading slashes from path
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
}

export async function apiRequest(endpoint, options = {}) {
  const url = joinUrls(config.API_BASE_URL, endpoint);
  console.log('API Request:', { url, endpoint, baseUrl: config.API_BASE_URL });
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    let fetchOptions = { ...options, headers };
    if (fetchOptions.body && typeof fetchOptions.body === 'object' && !(fetchOptions.body instanceof FormData)) {
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }
    const response = await fetch(url, fetchOptions);
    let data, text;
    try {
      data = await response.clone().json();
    } catch (e) {
      try {
        text = await response.clone().text();
      } catch (e2) {
        text = null;
      }
    }
    if (!response.ok) {
      // Suppress toast/console for expected fallback error
      const isExpectedStudentIdError = response.status === 400 && data && data.message && data.message.toLowerCase().includes('studentid');
      if (!isExpectedStudentIdError) {
        console.error('[API ERROR]', {
          url,
          status: response.status,
          statusText: response.statusText,
          data,
          text,
          options
        });
        showToast((data && data.message) || text || response.statusText || 'API Error', 'error');
      }
      const error = new Error((data && data.message) || text || response.statusText || 'API Error');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (err) {
    // Print the error to the browser console for debugging
    console.error('[API CATCH ERROR]', err, { url, options });
    showToast(err.message || 'Network/API Error', 'error');
    throw err;
  }
}
