const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
require('dotenv').config();

// Register User
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ msg: 'User with that email or username already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = new User({ username, email, password: hashedPassword });
        await user.save();
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({
            msg: 'User registered successfully',
            token,
            user: { id: user.id, username: user.username, email: user.email },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Login User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({
            msg: 'Logged in successfully',
            token,
            user: { id: user.id, username: user.username, email: user.email },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get User Info by Token
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;