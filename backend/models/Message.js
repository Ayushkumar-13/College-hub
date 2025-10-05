/*
 * FILE: backend/models/Message.js
 * LOCATION: college-social-platform/backend/models/Message.js
 * PURPOSE: Message model schema for MongoDB
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document']
    },
    url: String,
    publicId: String,
    filename: String
  }],
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);