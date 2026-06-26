import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true,
  },
  durationYears: {
    type: Number,
    default: 4,
    min: 1,
    max: 6,
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

courseSchema.index({ collegeId: 1, code: 1 }, { unique: true });

export default mongoose.model('Course', courseSchema);
