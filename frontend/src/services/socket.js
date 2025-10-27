import { io } from 'socket.io-client';

// The URL of our backend server
const SOCKET_URL = 'http://localhost:5000';

const socket = io(SOCKET_URL, {
    autoConnect: false, // We will manually connect later
});

// Optional: Add logging to see socket events in the browser console
socket.onAny((event, ...args) => {
    console.log(`Socket event received: ${event}`, args);
});

export default socket;