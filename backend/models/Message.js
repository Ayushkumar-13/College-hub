/*
 * FILE: backend/models/Message.js
 * PURPOSE: Message model schema for MongoDB (supports text, media, read status, issue forwarding)
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
    },
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read'],
      default: 'sending'
    },
    
    // 🔥 ISSUE FORWARDING FIELDS
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      index: true
    },
    isOriginalIssueMessage: {
      type: Boolean,
      default: false,
      index: true
    },
    autoForwarded: {
      type: Boolean,
      default: false
    },
    forwardCount: {
      type: Number,
      default: 0
    },
    originalMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  {
    timestamps: true // includes createdAt & updatedAt
  }
);

// Index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

// 🔥 Index for finding original issue messages quickly
messageSchema.index({ issueId: 1, isOriginalIssueMessage: 1 });

module.exports = mongoose.model('Message', messageSchema);