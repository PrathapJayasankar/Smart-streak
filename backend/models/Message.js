const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: { // Denormalized for easy display on the frontend
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
