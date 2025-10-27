import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import GroupChat from '../components/GroupChat'; // 💡 NEW IMPORT

const Dashboard = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [error, setError] = useState('');

    // 💡 AI Verification States
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null); // Task being completed
    const [userWork, setUserWork] = useState('');
    const [aiResult, setAiResult] = useState(null); // Stores quiz/fail result from AI

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
            setError('Failed to load tasks. You may need to log in again.');
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
        // ... (rest of handleAddTask logic is unchanged)
        try {
            const res = await api.post('/tasks', { 
                title: newTaskTitle, 
                description: newTaskDescription 
            });
            setTasks([res.data, ...tasks]); 
            setNewTaskTitle('');
            setNewTaskDescription('');
        } catch (err) {
            console.error('Failed to add task', err);
            setError('Failed to create task.');
        }
    };

    // 💡 PHASE 1: START AI VERIFICATION FLOW
    const handleStartVerification = (task) => {
        setCurrentTask(task);
        setIsAiModalOpen(true);
        setUserWork(''); // Clear previous work
        setAiResult(null); // Clear previous results
    };
    
    // 💡 PHASE 1: SUBMIT WORK TO AI ENDPOINT
    const handleVerifyWork = async (e) => {
        e.preventDefault();
        setError('');

        if (!userWork.trim()) {
            setError('Please submit your work before verification.');
            return;
        }

        try {
            const res = await api.post('/ai/verify', {
                taskId: currentTask._id,
                userWork: userWork,
                taskTitle: currentTask.title
            });
            
            // AI returns status: 'quiz' or status: 'fail'
            setAiResult(res.data); 
            setError(null);

        } catch (err) {
            console.error('AI Verification failed', err);
            // AI returned 400 with status: 'fail'
            setAiResult(err.response?.data);
            setError(null);
        }
    };

    // 💡 PHASE 1: HANDLE QUIZ ANSWER CHECK AND FINALIZE STREAK
    const handleQuizSubmit = async (selectedAnswer) => {
        setError('');

        // 1. Check if the selected answer is correct
        if (selectedAnswer === aiResult.question.answer) {
            // 2. If correct, finalize the streak on the backend
            try {
                // Call the NEW /finalize route
                const res = await api.put(`/tasks/${currentTask._id}/finalize`);
                
                // 3. Update the task list in the state
                setTasks(tasks.map(task => 
                    task._id === currentTask._id ? res.data : task
                ));
                alert(`✅ Correct! Streak updated to ${res.data.streak_count} days!`);
                setIsAiModalOpen(false); // Close modal on success
                
            } catch (err) {
                console.error('Streak finalization failed', err);
                setError(err.response?.data?.msg || 'Could not finalize streak. Already completed today?');
            }
        } else {
            // 4. If incorrect, instruct user to study more
            alert(`❌ Incorrect. Review the topic and try again tomorrow to keep your streak!`);
            setIsAiModalOpen(false); // Close modal on failure
        }
    };

    const handleDeleteTask = async (taskId) => {
        setError('');
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        // ... (rest of handleDeleteTask logic is unchanged)
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(tasks.filter(task => task._id !== taskId));
        } catch (err) {
            console.error('Failed to delete task', err);
            setError('Failed to delete task.');
        }
    };

    if (loading) {
        return <div className="container">Loading...</div>;
    }

    const formatLastCompleted = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // 💡 AI Verification Modal Component (Defined inline for simplicity)
    const AiVerificationModal = ({ task, onClose }) => {
        if (!task) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <button className="modal-close" onClick={onClose}>&times;</button>
                    <h4>AI Verification for: **{task.title}**</h4>
                    <hr/>

                    {/* Stage 1: Work Submission */}
                    {!aiResult && (
                        <form onSubmit={handleVerifyWork}>
                            <p>To confirm your habit, summarize what you learned about "{task.title}" today:</p>
                            <textarea
                                value={userWork}
                                onChange={(e) => setUserWork(e.target.value)}
                                rows="5"
                                placeholder="e.g., I learned that TCP uses a three-way handshake and that the SYN flag initiates the connection."
                                required
                            />
                            <button type="submit">Verify Work with AI</button>
                        </form>
                    )}

                    {/* Stage 2: AI Result (Quiz or Failure) */}
                    {aiResult && (
                        <>
                            <p className={`feedback ${aiResult.status}`}>
                                {aiResult.status === 'quiz' ? '✅ Great work! Now answer this question:' : '❌ Review required:'}
                                <br/>
                                **{aiResult.msg}**
                            </p>
                            
                            {/* Quiz Display (If PASS) */}
                            {aiResult.status === 'quiz' && aiResult.question && (
                                <div className="quiz-area">
                                    <p className="quiz-question">{aiResult.question.text}</p>
                                    <div className="quiz-options">
                                        {aiResult.question.options.map((option, index) => (
                                            <button 
                                                key={index} 
                                                className="quiz-option-btn"
                                                onClick={() => handleQuizSubmit(option)}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Failure Display (If FAIL) */}
                            {aiResult.status === 'fail' && (
                                <button onClick={onClose} style={{ marginTop: '15px' }}>
                                    I understand, I will study more.
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---
    return (
        <div className="dashboard-layout"> {/* New class for split layout */}
            
            {/* Left Side: Tasks and Streaks */}
            <div className="tasks-container">
                <header className="dashboard-header">
                    <h2>Hello, {user?.username}!</h2>
                    <button onClick={logout} className="logout-btn">
                        Logout
                    </button>
                </header>

                {error && <div className="alert">{error}</div>}

                <section className="add-task-section">
                    <h3>Create a New Network Study Habit</h3>
                    <form onSubmit={handleAddTask} className="task-form">
                        {/* ... (Task form inputs) */}
                        <input
                            type="text"
                            placeholder="Habit Title (e.g., Study TCP/IP Model)"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            required
                        />
                        <textarea
                            placeholder="Description (Optional)"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                        />
                        <button type="submit">Add Habit</button>
                    </form>
                </section>

                <section className="tasks-list-section">
                    <h3>Your Current Streaks ({tasks.length})</h3>
                    {tasks.length === 0 ? (
                        <p className="link-text">Get started by adding your first habit!</p>
                    ) : (
                        <ul className="task-list">
                            {tasks.map(task => (
                                <li key={task._id} className="task-item">
                                    <div>
                                        <h3>{task.title}</h3>
                                        <p>{task.description}</p>
                                        <p className="streak-info">
                                            🔥 **Current Streak:** {task.streak_count} days
                                        </p>
                                        <p className="streak-info">
                                            📅 Last Completed: {formatLastCompleted(task.last_completed_at)}
                                        </p>
                                    </div>
                                    <div className="task-actions">
                                        <button 
                                            onClick={() => handleStartVerification(task)} // 💡 CALL AI FLOW
                                            className="complete-button"
                                            disabled={task.last_completed_at && new Date(task.last_completed_at).toDateString() === new Date().toDateString()}
                                        >
                                            {task.last_completed_at && new Date(task.last_completed_at).toDateString() === new Date().toDateString() ? 'Completed Today' : 'Verify & Done'}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTask(task._id)}
                                            className="delete-button"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {/* Right Side: Socket.IO Group Chat */}
            <div className="chat-container">
                <GroupChat /> {/* 💡 SOCKET.IO CHAT COMPONENT */}
            </div>

            {/* AI Verification Modal */}
            {isAiModalOpen && (
                <AiVerificationModal 
                    task={currentTask} 
                    onClose={() => setIsAiModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Dashboard;