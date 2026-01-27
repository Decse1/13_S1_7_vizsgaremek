import axios from 'axios';
import { getToken, updateToken, clearAuthState } from './stores/auth.js';
import router from './router.js';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Check if backend sent a new token in the response header
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      updateToken(newToken);
      console.log('Token refreshed successfully');
    }
    return response;
  },
  (error) => {
    // Handle 401 (Unauthorized) and 403 (Forbidden) errors
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log('Authentication failed - logging out');
      clearAuthState();
      
      // Redirect to login page
      if (router.currentRoute.value.path !== '/bejelentkezes') {
        router.push('/bejelentkezes');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
