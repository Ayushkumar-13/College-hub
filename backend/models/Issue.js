/*
 * FILE: backend/models/Issue.js
 * PURPOSE: Issue model with full escalation chain
 */

import mongoose from 'mongoose';

const ESCALATION_LEVELS = [
  'coordinator',
  'hod',
  'domainSolver',
  'director',
  'owner',
  'resolved',
];

const issueSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemCategory',
    default: null,
  },
  problemCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemCategory',
    default: null,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  media: [{
    url: String,
    publicId: String,
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  currentAssigneeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'assigned'],
    default: 'Open',
  },
  coordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  domainSolverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  directorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  escalationLevel: {
    type: String,
    enum: [...ESCALATION_LEVELS, 'assigned', 'Director', 'Owner', null],
    default: 'coordinator',
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  escalatedAt: {
    type: Date,
  },
  directorEscalated: { type: Boolean, default: false },
  ownerEscalated: { type: Boolean, default: false },
  escalationHistory: [
    {
      level: String,
      role: String,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      assignedAt: { type: Date, default: Date.now },
      escalatedAt: { type: Date },
      action: { type: String, default: 'assigned' },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

issueSchema.pre('save', function syncCategory(next) {
  if (this.categoryId && !this.problemCategoryId) {
    this.problemCategoryId = this.categoryId;
  } else if (this.problemCategoryId && !this.categoryId) {
    this.categoryId = this.problemCategoryId;
  }
  if (this.currentAssigneeId && !this.assignedTo) {
    this.assignedTo = this.currentAssigneeId;
  } else if (this.assignedTo && !this.currentAssigneeId) {
    this.currentAssigneeId = this.assignedTo;
  }
  next();
});

issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ currentAssigneeId: 1 });
issueSchema.index({ collegeId: 1, status: 1 });

const Issue = mongoose.model('Issue', issueSchema);
export { ESCALATION_LEVELS };
export default Issue;
