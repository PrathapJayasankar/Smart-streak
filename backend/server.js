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

// --- START: SIMPLIFIED CORS CONFIGURATION ---

// 1. Define the list of allowed websites.
const allowedOrigins = [
    'http://localhost:3000',
    'https://smart-streak-9mvqvqscf-prathap-js-projects.vercel.app' // Your Vercel URL
];

// 2. Use a simpler CORS setup for both Express and Socket.IO
app.use(cors({ origin: allowedOrigins }));
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

// --- END: SIMPLIFIED CORS CONFIGURATION ---


// --- Connect to DB & Apply Middleware ---
connectDB();
app.use(express.json());


// --- Define API Routes Explicitly ---
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/groups', groupRoutes);


// Simple root route for testing
app.get('/', (req, res) => {
    res.send('Habit Streak API is running...');
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('A user connected with socket id:', socket.id);

    socket.on('joinGroup', (groupId) => {
        socket.join(groupId);
        console.log(`User ${socket.id} joined group ${groupId}`);
    });
    socket.on('leaveGroup', (groupId) => {
        socket.leave(groupId);
        console.log(`User ${socket.id} left group ${groupId}`);
    });
    socket.on('sendChatMessage', async ({ groupId, userId, username, text }) => {
        try {
            const message = new Message({ group: groupId, user: userId, username, text });
            await message.save();
            io.to(groupId).emit('chatMessage', { user: userId, username, text, createdAt: message.createdAt });
        } catch (err) {
            console.error('Error handling chat message:', err);
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));