/*
 * FILE: backend/models/User.js
 * LOCATION: college-social-platform/backend/models/User.js
 * PURPOSE: User model schema for MongoDB
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,       // Mongoose automatically creates index
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  phone: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['Student', 'Faculty', 'Staff', 'VIP'],
    required: [true, 'Role is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  bio: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Only keep non-duplicate indexes
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

module.exports = mongoose.model('User', userSchema);
