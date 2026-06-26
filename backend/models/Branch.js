import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Branch code is required'],
    trim: true,
    uppercase: true,
  },
  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

branchSchema.index({ courseId: 1, code: 1 }, { unique: true });

export default mongoose.model('Branch', branchSchema);
