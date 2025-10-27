
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Group = require('../models/Group');
const User = require('../models/User');

// Create a new group
router.post('/', auth, async (req, res) => {
    const { name, description } = req.body;

    try {
        // Check if a group with this name already exists
        let group = await Group.findOne({ name });
        if (group) {
            return res.status(400).json({ msg: 'Group with that name already exists' });
        }

        // Create the new group
        group = new Group({
            name,
            description,
            creator: req.userId,
            members: [req.userId], // The creator is the first member
        });

        await group.save();
        res.status(201).json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all available groups
router.get('/', auth, async (req, res) => {
    try {
        const groups = await Group.find().populate('creator', 'username').sort({ createdAt: -1 });
        res.json(groups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get details of a single group (including members)
router.get('/:id', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id).populate('members', 'username');
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }
        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Join a group
router.post('/:id/join', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Check if user is already a member
        if (group.members.some(member => member.equals(req.userId))) {
            return res.status(400).json({ msg: 'User is already a member of this group' });
        }

        group.members.push(req.userId);
        await group.save();
        
        // Populate member data to send back to the client
        await group.populate('members', 'username');
        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;