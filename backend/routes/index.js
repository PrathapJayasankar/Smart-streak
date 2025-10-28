const express = require('express');
const router = express.Router();

// Import individual route files
const authRoutes = require('./authRoutes');
const taskRoutes = require('./taskRoutes');
const groupRoutes = require('./groupRoutes');

// Define the base path for each route file
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/groups', groupRoutes);

module.exports = router;