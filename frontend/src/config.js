// Unified configuration for backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://student-management-backend.onrender.com";

// Ensure the API_BASE_URL ends with /api/
const getApiBaseUrl = () => {
  let url = API_BASE_URL;
  
  // Remove trailing slash if exists
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  // Add /api if not present
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  
  return url + '/';
};

const config = {
  API_BASE_URL: getApiBaseUrl(),
};

// For debugging
console.log('API Base URL:', config.API_BASE_URL);

export default config;
