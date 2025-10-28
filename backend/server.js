const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const apiRoutes = require('./routes'); // <-- Import the new central router
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// --- Unified CORS Configuration ---
const allowedOrigins = [
    'http://localhost:3000',
    'https://smart-streak-9mvqvqscf-prathap-js-projects.vercel.app' // Your Vercel URL
];
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
const socketCorsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
};
const io = new Server(server, { cors: socketCorsOptions });

// --- Connect to DB & Apply Middleware ---
connectDB();
app.use(cors(corsOptions));
app.use(express.json());

// --- API Routes ---
// All API routes will be prefixed with /api
app.use('/api', apiRoutes); // <-- Use the central router here

// Simple root route for testing
app.get('/', (req, res) => {
    res.send('Habit Streak API is running...');
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    // ... all your socket.on events ... (this part doesn't change)
    console.log('A user connected with socket id:', socket.id);
    socket.on('joinGroup', (groupId) => { socket.join(groupId); console.log(`User ${socket.id} joined group ${groupId}`); });
    socket.on('leaveGroup', (groupId) => { socket.leave(groupId); console.log(`User ${socket.id} left group ${groupId}`); });
    socket.on('sendChatMessage', async ({ groupId, userId, username, text }) => {
        try {
            const message = new Message({ group: groupId, user: userId, username, text });
            await message.save();
            io.to(groupId).emit('chatMessage', { user: userId, username, text, createdAt: message.createdAt });
        } catch (err) { console.error('Error handling chat message:', err); }
    });
    socket.on('disconnect', () => { console.log('User disconnected:', socket.id); });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));