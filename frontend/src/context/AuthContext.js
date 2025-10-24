import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
const AuthContext = createContext(null);

  export const AuthProvider = ({ children }) => {
      const [user, setUser] = useState(null);
      const [token, setToken] = useState(localStorage.getItem('token'));
      const [loading, setLoading] = useState(true);

      useEffect(() => {
          const loadUser = async () => {
              if (token) {
                  try {
                       const response = await api.get('/auth/me'); // Get user data from token
                       setUser(response.data.user);
                  } catch (err) {
                      console.error('Token invalid or user data fetch failed', err);
                      logout(); // If token is invalid, log out
                  }
              }
              setLoading(false);
          };
          loadUser();
      }, [token]);

      const login = async (email, password) => {
          try {
              const res = await api.post('/auth/login', { email, password });
              setToken(res.data.token);
              localStorage.setItem('token', res.data.token);
              setUser(res.data.user);
              return true;
          } catch (err) {
              console.error('Login failed', err.response?.data || err.message);
              return false;
          }
      };

      const register = async (username, email, password) => {
          try {
              const res = await api.post('/auth/register', { username, email, password });
              setToken(res.data.token);
              localStorage.setItem('token', res.data.token);
              setUser(res.data.user);
              return true;
          } catch (err) {
              console.error('Registration failed', err.response?.data || err.message);
              return false;
          }
      };

      const logout = () => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
      };

      return (
          <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
              {children}
          </AuthContext.Provider>
      );
  };

  export const useAuth = () => useContext(AuthContext);
  