/*
 * FILE: backend/models/Issue.js
 * PURPOSE: Issue model schema for MongoDB (with escalation flags)
 */

const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  media: [{
    url: String,
    publicId: String
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open'
  },

  // 🔥 REQUIRED for auto-escalation
  directorEscalated: {
    type: Boolean,
    default: false
  },
  ownerEscalated: {
    type: Boolean,
    default: false
  },

  // Optional older escalation tracking fields
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalationLevel: {
    type: String,
    enum: ['assigned', 'Director', 'Owner', null],
    default: null
  },
  escalatedAt: {
    type: Date
  },
  escalationHistory: [
    {
      role: String,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      escalatedAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Issue', issueSchema);
