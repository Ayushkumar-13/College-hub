/*
 * FILE: backend/routes/auth.js
 * PURPOSE: Authentication routes (login, register) with JWT and consistent success/error responses
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt'); // JWT utility

// Helper: format user response
function formatUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department,
    bio: user.bio,
    avatar: user.avatar,
    followers: user.followers ? user.followers.length : 0,
    following: user.following ? user.following.length : 0
  };
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, department, bio } = req.body;

    // Validate required fields
    if (!name || !email || !password || !department) {
      return res.status(400).json({ success: false, error: 'Required fields are missing' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, error: 'Email already registered' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role,
      department,
      bio: bio || '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      followers: [],
      following: []
    });

    await user.save();

    // Sign JWT token
    const token = signToken({ id: user._id, role: user.role });

    // Respond
    res.status(201).json({
      success: true,
      token,
      user: formatUser(user)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid email or password' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Invalid email or password' });

    // Sign JWT token
    const token = signToken({ id: user._id, role: user.role });

    // Respond
    res.json({
      success: true,
      token,
      user: formatUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
