// Unified configuration for backend API URL
// This will use the Vercel environment variable if set,
// otherwise fall back to the Render backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://student-tpkr.onrender.com/api";

const config = {
  API_BASE_URL,
};

export default config;