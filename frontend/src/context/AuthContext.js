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
                    const res = await api.get('/auth/me');
                    setUser(res.data.user);
                } catch (err) { logout(); }
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
        } catch (err) { return false; }
    };

const register = async (username, email, password) => {
    try {
        const res = await api.post('/auth/register', { username, email, password });
        // ... some code to set token and user ...
        return true; // It returns true if the API call succeeds
    } catch (err) {
        console.error('Registration failed', err.response?.data || err.message);
        return false; // It returns false if the API call fails
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