const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db'); // Our MongoDB connection function
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const app = express();

    // Connect to database
    connectDB();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/tasks', taskRoutes);

    // Simple root route
    app.get('/', (req, res) => {
        res.send('Habit Streak API is running...');
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
