const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const groupRoutes = require('./routes/groupRoutes');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// --- START: UNIFIED CORS CONFIGURATION ---

// 1. Define the list of all websites you want to allow.
const allowedOrigins = [
    'http://localhost:3000', // For your local development
    'https://habit-streak-app.vercel.app' // <<-- IMPORTANT: REPLACE WITH YOUR REAL VERCEL URL
];

// 2. CORS Options for Express API
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

// 3. CORS Configuration for Socket.IO Server
const socketCorsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
};

// Initialize Socket.IO server with its CORS options
const io = new Server(server, { cors: socketCorsOptions });

// --- END: UNIFIED CORS CONFIGURATION ---


// Connect to database
connectDB();


// --- Apply Middleware ---
app.use(cors(corsOptions)); // Apply the Express CORS options
app.use(express.json());


// --- Define Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/groups', groupRoutes);


// ... (The rest of your server.js file remains exactly the same) ...

// Simple root route
app.get('/', (req, res) => {
    res.send('Habit Streak API is running...');
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    // ... all your socket.on events ...
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));