const express = require('express');
const cors = require('cors'); // Make sure cors is imported
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const groupRoutes = require('./routes/groupRoutes');
const Message = require('./models/Message');

const app = express();

// --- START: CORRECT CORS CONFIGURATION ---
// This section MUST be before the routes are defined.
const corsOptions = {
  origin: 'http://localhost:3000', // Allow only your React app to make requests
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));
// --- END: CORRECT CORS CONFIGURATION ---

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // CORS for Socket.IO
        methods: ["GET", "POST"]
    }
});

// Connect to database
connectDB();

// Middleware
// We moved cors() up, but express.json() can stay here.
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/groups', groupRoutes);

// Simple root route
app.get('/', (req, res) => {
    res.send('Habit Streak API is running...');
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('A user connected with socket id:', socket.id);

    socket.on('joinGroup', (groupId) => {
        socket.join(groupId);
        console.log(`User ${socket.id} joined group ${groupId}`);
        socket.emit('chatMessage', { username: 'System', text: `Welcome to the group chat!` });
    });

    socket.on('leaveGroup', (groupId) => {
        socket.leave(groupId);
        console.log(`User ${socket.id} left group ${groupId}`);
    });

    socket.on('sendChatMessage', async ({ groupId, userId, username, text }) => {
        try {
            const message = new Message({ group: groupId, user: userId, username: username, text: text });
            await message.save();
            io.to(groupId).emit('chatMessage', { user: userId, username: username, text: text, createdAt: message.createdAt });
        } catch (err) {
            console.error('Error saving or broadcasting message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));