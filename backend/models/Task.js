const mongoose = require('mongoose');
const TaskSchema = new mongoose.Schema({
      user: { // This will store the ObjectId of the User
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
      },
      title: {
          type: String,
          required: true,
      },
      description: {
          type: String,
      },
      created_at: {
          type: Date,
          default: Date.now,
      },
      streak_count: {
          type: Number,
          default: 0,
      },
      last_completed_at: {
          type: Date, // We can store the date directly
      },
  });

  module.exports = mongoose.model('Task', TaskSchema);
