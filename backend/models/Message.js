/*
 * FILE: backend/models/Message.js
 * PURPOSE: Message model schema for MongoDB (supports text, media, read status)
 */

const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video', 'document'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: String,
  filename: String
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    text: {
      type: String,
      default: ''
    },
    media: [mediaSchema],
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true // includes createdAt & updatedAt
  }
);

// Index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
