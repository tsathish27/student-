// Unified configuration for backend API URL
// Change this value to point frontend to any backend instance
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const config = {
  API_BASE_URL,
};

export default config;
