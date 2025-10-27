import React, { useState, useEffect, useRef } from 'react';
import socket from '../../services/socket';
import './GroupChat.css'; // We will create this CSS file next

const GroupChat = ({ group, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null); // Ref to auto-scroll to the bottom

    // Effect to scroll to the bottom of the chat on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Effect for handling socket events
    useEffect(() => {
        // When component mounts, tell the server we are joining this group's room
        socket.emit('joinGroup', group._id);

        // Listener for incoming chat messages
        const messageListener = (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        };
        socket.on('chatMessage', messageListener);

        // Cleanup when component unmounts
        return () => {
            socket.emit('leaveGroup', group._id);
            socket.off('chatMessage', messageListener);
        };
    }, [group._id]); // Re-run this effect if the group ID changes

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            // Emit the message to the server
            socket.emit('sendChatMessage', {
                groupId: group._id,
                userId: user.id,
                username: user.username,
                text: newMessage,
            });
            setNewMessage('');
        }
    };

    return (
        <div className="chat-container">
            <div className="messages-list">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-item ${msg.username === user.username ? 'my-message' : 'other-message'}`}>
                        <div className="message-header">
                            <strong>{msg.username}</strong>
                            <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
                        </div>
                        <p>{msg.text}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} /> {/* Dummy div to scroll to */}
            </div>
            <form onSubmit={handleSendMessage} className="message-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default GroupChat;