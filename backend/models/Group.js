const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true, // Removes whitespace from both ends
    },
    description: {
        type: String,
        required: true,
    },
    members: [{ // An array of user ObjectIds
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

module.exports = mongoose.model('Group', GroupSchema);