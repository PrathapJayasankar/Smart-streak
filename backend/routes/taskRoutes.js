const express = require('express');
const router = express.Router();
const Task = require('../models/Task'); // Mongoose Task model
const auth = require('../middleware/authMiddleware');
// Helper to calculate streak (simplified for now)
  const calculateStreak = (lastCompletedAt, currentStreak) => {
      if (!lastCompletedAt) return 1; // First completion

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day

      const lastCompletionDate = new Date(lastCompletedAt);
      lastCompletionDate.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      // If completed today (already, do nothing or prevent duplicate completion)
      if (lastCompletionDate.getTime() === today.getTime()) {
          return currentStreak; // Already completed today, no change to streak
      }
      // If completed yesterday, increment streak
      else if (lastCompletionDate.getTime() === yesterday.getTime()) {
          return currentStreak + 1;
      }
      // If completed before yesterday, streak is broken
      else {
          return 1; // Reset streak
      }
  };

  // Create a Task
  router.post('/', auth, async (req, res) => {
      const { title, description } = req.body;
      const userId = req.userId; // From auth middleware

      try {
          const newTask = new Task({
              user: userId, // Assign the user's ObjectId
              title,
              description,
          });

          await newTask.save();
          res.status(201).json(newTask);
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error');
      }
  });

  // Get All User Tasks
  router.get('/', auth, async (req, res) => {
      const userId = req.userId;

      try {
          const tasks = await Task.find({ user: userId }).sort({ created_at: -1 });
          res.json(tasks);
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error');
      }
  });

  // Mark Task as Complete for Today (and update streak)
  router.put('/:id/complete', auth, async (req, res) => {
      const taskId = req.params.id;
      const userId = req.userId;
      const today = new Date();
      today.setHours(0,0,0,0); // Normalize to start of day

      try {
          // Get current task details
          const task = await Task.findOne({ _id: taskId, user: userId });
          if (!task) {
              return res.status(404).json({ msg: 'Task not found or not authorized' });
          }

          // Prevent duplicate completion for the same day
          if (task.last_completed_at) {
              const lastCompletionDate = new Date(task.last_completed_at);
              lastCompletionDate.setHours(0,0,0,0);
              if (lastCompletionDate.getTime() === today.getTime()) {
                  return res.status(400).json({ msg: 'Task already completed today.' });
              }
          }

          const newStreak = calculateStreak(task.last_completed_at, task.streak_count);

          task.streak_count = newStreak;
          task.last_completed_at = today; // Store today's date
          await task.save();

          res.json(task);
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error');
      }
  });

  // Delete a Task
  router.delete('/:id', auth, async (req, res) => {
      const taskId = req.params.id;
      const userId = req.userId;

      try {
          const task = await Task.findOneAndDelete({ _id: taskId, user: userId });

          if (!task) {
              return res.status(404).json({ msg: 'Task not found or not authorized' });
          }

          res.json({ msg: 'Task deleted successfully', task });
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error');
      }
  });

  module.exports = router;