import axios from 'axios';

// When deployed on Vercel, it will use the REACT_APP_API_URL we provide.
// When running locally (`npm start`), it will fall back to the localhost address.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
}, (error) => Promise.reject(error));

export default api;