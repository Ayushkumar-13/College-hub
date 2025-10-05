/*
 * FILE: backend/models/Post.js
 * LOCATION: college-social-platform/backend/models/Post.js
 * PURPOSE: Post model schema for MongoDB
 */

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video']
    },
    url: String,
    publicId: String
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: {
    type: Number,
    default: 0
  },
  isRepost: {
    type: Boolean,
    default: false
  },
  originalPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  trending: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ trending: 1 });

module.exports = mongoose.model('Post', postSchema);