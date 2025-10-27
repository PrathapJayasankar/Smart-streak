import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { register } = useAuth();

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await register(username, email, password); // This calls the function in AuthContext
    if (success) { // If 'success' is true
        navigate('/dashboard');
    } else { // If 'success' is false
        setError('Registration failed. User might already exist.'); // This is your message!
    }
};
    return (
        <div className="container">
            <h2>Register</h2>
            {error && <div className="alert">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Register</button>
            </form>
            <p className="link-text">Already have an account? <Link to="/login">Login</Link></p>
        </div>
    );
};

export default Register;