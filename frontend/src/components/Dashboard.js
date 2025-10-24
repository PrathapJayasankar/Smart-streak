import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        } else if (user) {
            fetchTasks();
        }
    }, [user, loading, navigate]);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data);
        } catch (err) {
            console.error('Failed to fetch tasks', err);
            setError('Failed to load tasks.');
            if (err.response && err.response.status === 401) {
                logout(); // Token expired or invalid, force logout
            }
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        setError('');
        if (!newTaskTitle.trim()) {
            setError('Task title cannot be empty.');
            return;
        }