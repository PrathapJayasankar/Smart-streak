const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Mongoose User model
const auth = require('../middleware/authMiddleware'); // Our authentication middleware
require('dotenv').config();
// Register User
  router.post('/register', async (req, res) => {
      const { username, email, password } = req.body;

      try {
          // Check if user already exists
          let user = await User.findOne({ $or: [{ email }, { username }] });
          if (user) {
              return res.status(400).json({ msg: 'User with that email or username already exists' });
          }

          // Hash password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          // Create new user instance
          user = new User({
              username,
              email,
              password: hashedPassword,
          });

          // Save user to database
          await user.save();

          // Create JWT
          const token = jwt.sign(
              { userId: user.id }, // Use user.id which is Mongoose's way to access _id
              process.env.JWT_SECRET,
              { expiresIn: '1h' }
          );

          res.status(201).json({
              msg: 'User registered successfully',
              token,
              user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
              },
          });
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error');
      }
  });

  // Login User
  router.post('/login', async (req, res) => {
      const { email, password } = req.body;

      try {
          // Check if user exists
          let user = await User.findOne({ email });
          if (!user) {
              return res.status(400).json({ msg: 'Invalid Credentials' });
          }

          // Check password
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
              return res.status(400).json({ msg: 'Invalid Credentials' });
          }

          // Create JWT
          const token = jwt.sign(
              { userId: user.id },
              process.env.JWT_SECRET,
              { expiresIn: '1h' }
          );

          res.json({
              msg: 'Logged in successfully',
              token,
              user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
              },
          });
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error');
      }
  });

  // Get User Info by Token (requires auth middleware)
  router.get('/me', auth, async (req, res) => {
      try {
          // req.userId is set by the auth middleware
          const user = await User.findById(req.userId).select('-password'); // Exclude password
          if (!user) {
              return res.status(404).json({ msg: 'User not found' });
          }
          res.json({ user: { id: user.id, username: user.username, email: user.email } });
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error');
      }
  });

  module.exports = router;