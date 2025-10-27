import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import GroupsPage from './groups/GroupsPage';
import GroupChat from './groups/GroupChat'; // We will create and uncomment this next

const Dashboard = () => {
    // --- State Variables ---
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('habits'); // 'habits' or 'groups'
    const [selectedGroup, setSelectedGroup] = useState(null);

    // State for Habit Tracking
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [error, setError] = useState('');

    // --- Memoized fetchTasks Function ---
    const fetchTasks = useCallback(async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data);
        } catch (err) {
            setError('Failed to load tasks.');
            if (err.response?.status === 401) logout();
        }
    }, [logout]);

    // --- useEffect Hooks ---
    useEffect(() => {
        socket.connect();
        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        } else if (user) {
            fetchTasks();
        }
    }, [user, loading, navigate, fetchTasks]);

    // --- Habit Tracking Handlers ---
    const handleAddTask = async (e) => {
        e.preventDefault();
        setError('');
        if (!newTaskTitle.trim()) return setError('Task title cannot be empty.');
        try {
            await api.post('/tasks', { title: newTaskTitle, description: newTaskDescription });
            setNewTaskTitle('');
            setNewTaskDescription('');
            fetchTasks();
        } catch (err) { setError('Failed to add task.'); }
    };

    const handleCompleteTask = async (taskId) => {
        setError('');
        try {
            const res = await api.put(`/tasks/${taskId}/complete`);
            setTasks(tasks.map(t => t._id === taskId ? { ...t, ...res.data } : t));
        } catch (err) { setError(err.response?.data?.msg || 'Failed to complete task.'); }
    };

    const handleDeleteTask = async (taskId) => {
        setError('');
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(tasks.filter(t => t._id !== taskId));
        } catch (err) { setError('Failed to delete task.'); }
    };

    // --- View Rendering Logic ---
    const renderHabitsView = () => (
        <>
            <h2>Create New Task</h2>
            {error && <div className="alert">{error}</div>}
            <form onSubmit={handleAddTask}>
                <input type="text" placeholder="Task Title (e.g., Read for 30 mins)" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
                <textarea placeholder="Description (optional)" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)}></textarea>
                <button type="submit">Add Task</button>
            </form>

            <h2 style={{ marginTop: '30px' }}>My Tasks</h2>
            <ul className="task-list">
                {tasks.length === 0 ? <p>No tasks yet. Add one!</p> : tasks.map((task) => (
                    <li key={task._id} className="task-item">
                        <h3>{task.title}</h3>
                        {task.description && <p>{task.description}</p>}
                        <p className="streak-info">🔥 Streak: {task.streak_count} {task.streak_count === 1 ? 'day' : 'days'}{(task.last_completed_at && ` (Last: ${new Date(task.last_completed_at).toLocaleDateString()})`)}</p>
                        <div className="task-actions">
                            <button className="complete-button" onClick={() => handleCompleteTask(task._id)}>Complete Today</button>
                            <button className="delete-button" onClick={() => handleDeleteTask(task._id)}>Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );

    const renderGroupsView = () => {
        if (selectedGroup) {
            // If a group is selected, show the chat component
            return (
                <div>
                    <h2>Chat for {selectedGroup.name}</h2>
                    <button onClick={() => setSelectedGroup(null)}>Back to Groups</button>
                    <p>The REAL chat component will go here.</p>
                    {<GroupChat group={selectedGroup} user={user} />}
                </div>
            );
        }
        // Otherwise, show the list of groups
        return <GroupsPage onSelectGroup={(group) => setSelectedGroup(group)} />;
    };

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                <h1>Habit Streak</h1>
                <div>
                    <button onClick={() => setView('habits')} disabled={view === 'habits'} style={{ marginRight: '10px' }}>My Habits</button>
                    <button onClick={() => setView('groups')} disabled={view === 'groups'}>Groups</button>
                </div>
                <button onClick={logout} className="delete-button">Logout</button>
            </header>

            {view === 'habits' ? renderHabitsView() : renderGroupsView()}
        </div>
    );
};

export default Dashboard;