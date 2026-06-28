/*
 * FILE: backend/models/Message.js
 * PURPOSE: Message schema supporting escalation forwarding
 */

import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video', 'document'], required: true },
  url: { type: String, required: true },
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

    text: { type: String, default: '' },
    media: [mediaSchema],
    read: { type: Boolean, default: false },

    // Status for UI
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read'],
      default: 'sending'
    },

    // REQUIRED FOR ISSUE FORWARDING
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

    messageType: {
      type: String,
      enum: ['text', 'call'],
      default: 'text',
    },

    callType: {
      type: String,
      enum: ['audio', 'video'],
      default: null,
    },

    callDuration: {
      type: Number,
      default: 0,
      min: 0,
    },

    callStatus: {
      type: String,
      enum: ['completed', 'missed', 'rejected', 'cancelled'],
      default: null,
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
  { timestamps: true }
);

// Indexes
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ issueId: 1, isOriginalIssueMessage: 1 });

export default mongoose.model('Message', messageSchema);
