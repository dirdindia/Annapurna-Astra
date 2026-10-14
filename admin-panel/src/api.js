import axios from 'axios';

// Since this is for local development, we point to the backend's local URL
// In production, you would use an environment variable (e.g. import.meta.env.VITE_API_URL)
const API_URL = 'http://localhost:5000/api';
// const API_URL = 'https://saas-billing-app.onrender.com/api/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let activeRequests = 0;

const handleRequestStart = (config) => {
  if (!config.headers?.hideLoader) {
    activeRequests++;
    if (activeRequests === 1) {
      window.dispatchEvent(new Event('show-loader'));
    }
  }
  return config;
};

const handleRequestEnd = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    window.dispatchEvent(new Event('hide-loader'));
  }
};

api.interceptors.request.use(
  handleRequestStart,
  (error) => {
    if (!error.config?.headers?.hideLoader) handleRequestEnd();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (!response.config?.headers?.hideLoader) handleRequestEnd();
    return response;
  },
  (error) => {
    if (!error.config?.headers?.hideLoader) handleRequestEnd();
    return Promise.reject(error);
  }
);

export default api;
