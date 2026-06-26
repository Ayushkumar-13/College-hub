import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
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
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    default: null,
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 1,
    max: 6,
  },
  semester: {
    type: Number,
    enum: [1, 2],
    default: 1,
  },
  name: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true,
  },
  coordinatorId: {
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

sectionSchema.index({ branchId: 1, sessionId: 1, year: 1, semester: 1, name: 1 }, { unique: true });

export default mongoose.model('Section', sectionSchema);
