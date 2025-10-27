import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    // State for form inputs and error display
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get auth functions and user status
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Effect to redirect the user if they are already logged in
    useEffect(() => {
        if (user) {
            navigate('/'); // Redirect to Dashboard
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!username || !password) {
            setError('Please enter both username and password.');
            setIsSubmitting(false);
            return;
        }

        try {
            await login(username, password);
            // Redirection handled by the useEffect above
        } catch (err) {
            // Error comes from AuthContext
            setError(err.message); 
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Login to Net-Streaks</h2>
                <p>Track your network study habits and connect with others.</p>
                
                {/* Error Display */}
                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="link-text">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;