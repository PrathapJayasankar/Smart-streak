const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/authMiddleware');

const calculateStreak = (lastCompletedAt, currentStreak) => {
    if (!lastCompletedAt) return 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastCompletionDate = new Date(lastCompletedAt);
    lastCompletionDate.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (lastCompletionDate.getTime() === today.getTime()) {
        return currentStreak;
    } else if (lastCompletionDate.getTime() === yesterday.getTime()) {
        return currentStreak + 1;
    } else {
        return 1;
    }
};

// Create a Task
router.post('/', auth, async (req, res) => {
    const { title, description } = req.body;
    try {
        const newTask = new Task({ user: req.userId, title, description });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get All User Tasks
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.userId }).sort({ created_at: -1 });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Mark Task as Complete for Today
router.put('/:id/complete', auth, async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.userId });
        if (!task) {
            return res.status(404).json({ msg: 'Task not found or not authorized' });
        }
        if (task.last_completed_at) {
            const lastCompletionDate = new Date(task.last_completed_at);
            lastCompletionDate.setHours(0, 0, 0, 0);
            if (lastCompletionDate.getTime() === today.getTime()) {
                return res.status(400).json({ msg: 'Task already completed today.' });
            }
        }
        task.streak_count = calculateStreak(task.last_completed_at, task.streak_count);
        task.last_completed_at = today;
        await task.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a Task
router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
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