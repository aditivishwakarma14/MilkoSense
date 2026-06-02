import axios from 'axios';
import storageService from './storageService';

// Detect host environment and resolve backend base server port
const getBaseURL = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  return window.location.origin; // In docker production, the web root proxy resolves routes
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10 second timeout for high-speed industrial feeds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (supports authentication or telemetry tokens)
apiClient.interceptors.request.use(
  (config) => {
    const token = storageService.get('milkosense_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for global error catching and network fallbacks
apiClient.interceptors.response.use(
  (response) => response.data, // Strip axios metadata, returning data payload directly
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'API request timed out',
      status: error.response?.status || 500,
      code: error.code || 'UNKNOWN_ERROR',
    };
    
    console.error('[API Client Error]:', customError);
    return Promise.reject(customError);
  }
);

export default apiClient;
