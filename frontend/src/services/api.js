import axios from 'axios';
const API_URL = 'http://localhost:5000/api'; // Ensure this matches your backend port

  const api = axios.create({
      baseURL: API_URL,
      headers: {
          'Content-Type': 'application/json',
      },
  });

  // Interceptor to attach token to requests
  api.interceptors.request.use(
      (config) => {
          const token = localStorage.getItem('token');
          if (token) {
              config.headers['x-auth-token'] = token;
          }
          return config;
      },
      (error) => {
          return Promise.reject(error);
      }
  );

  export default api;
