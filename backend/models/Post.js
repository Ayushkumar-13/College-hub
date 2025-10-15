/*
 * FILE: backend/models/Post.js
 * PURPOSE: Post model with support for feed, announcements, problems, likes, comments, replies, shares, reposts, and escalation
 */

const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replies: [replySchema],
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String
    }
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Main content
    content: {
      type: String,
      default: ''
    },
    media: [mediaSchema],

    // Post type
    type: {
      type: String,
      enum: ['feed', 'announcement'],
      default: 'feed'
    },

    // Problem-specific fields
    problemDescription: {
      type: String
    },
  

    // Likes, comments, shares
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    comments: [commentSchema],
    shares: {
      type: Number,
      default: 0
    },

    // Reposts
    isRepost: {
      type: Boolean,
      default: false
    },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    repostCaption: {
      type: String
    },

    // Trending flag
    trending: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
