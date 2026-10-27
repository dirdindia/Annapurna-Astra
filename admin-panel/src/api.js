import axios from 'axios';

// Since this is for local development, we point to the backend's local URL
// In production, you would use an environment variable (e.g. import.meta.env.VITE_API_URL)
// const API_URL = 'http://localhost:5000/api';
const getBaseUrl = () => {
  if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://annapurna-astra.onrender.com/";
  }
  return "http://localhost:5000/";
};

const api = axios.create({
  baseURL: getBaseUrl(),
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

export { api };
export default api;
