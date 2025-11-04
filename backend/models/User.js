/*
 * FILE: backend/models/User.js
 * PURPOSE: User model schema for MongoDB (department required conditionally)
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  phone: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['Student', 'Faculty', 'Staff', 'Director', 'Owner', 'HOD'],
    required: [true, 'Role is required'],
  },
  department: {
    type: String,
    required: function () {
      // Department required for everyone EXCEPT Director and Owner
      return this.role !== 'Director' && this.role !== 'Owner';
    },
    default: null,
  },
  bio: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/*
 * INDEXES
 * - Ensures efficient queries and unique role enforcement
 */

userSchema.index({ department: 1 });

// Only one Director and one Owner in system
userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: { $in: ['Director', 'Owner'] } },
  }
);

module.exports = mongoose.model('User', userSchema);
