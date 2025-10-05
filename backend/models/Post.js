/**
 * FILE: backend/models/Post.js
 * PURPOSE: Post model schema - UPDATED to allow posts with only media
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
    trim: true,
    default: '' // Made optional - can be empty if media exists
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
    text: {
      type: String,
      required: true
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replies: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: {
        type: String,
        required: true
      },
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
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
  repostCaption: {
    type: String,
    trim: true
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

// Validate that post has either content or media
postSchema.pre('validate', function(next) {
  if (!this.content && (!this.media || this.media.length === 0)) {
    next(new Error('Post must have either content or media'));
  } else {
    next();
  }
});

// Index for faster queries
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ trending: 1 });
postSchema.index({ likes: 1 });

module.exports = mongoose.model('Post', postSchema);