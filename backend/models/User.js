/*
 * FILE: backend/models/User.js
 * PURPOSE: User model with multi-college academic hierarchy
 */

import mongoose from 'mongoose';

const BASE_ROLES = ['Student', 'Faculty', 'Staff', 'Owner', 'Admin', 'SuperAdmin'];

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
    enum: BASE_ROLES,
    required: [true, 'Role is required'],
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    default: null,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  year: {
    type: Number,
    default: null,
    min: 1,
    max: 6,
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    default: null,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    default: null,
  },
  semester: {
    type: Number,
    enum: [1, 2],
    default: 1,
  },
  rollNumber: {
    type: String,
    default: null,
    trim: true,
  },
  department: {
    type: String,
    default: null,
  },
  designation: {
    type: String,
    default: null,
    trim: true,
  },
  baseDesignation: {
    type: String,
    default: null,
    trim: true,
  },
  employeeId: {
    type: String,
    default: null,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
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

userSchema.index(
  { collegeId: 1, role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'Owner' },
  }
);

userSchema.index(
  { collegeId: 1, rollNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: 'Student',
      rollNumber: { $exists: true, $type: 'string' },
    },
  }
);

const User = mongoose.model('User', userSchema);
export { BASE_ROLES };
export default User;
