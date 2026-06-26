import mongoose from 'mongoose';

const studentCredentialSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
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
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true,
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
  email: {
    type: String,
    default: null,
    lowercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active'],
    default: 'pending',
  },
  userId: {
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

studentCredentialSchema.index({ collegeId: 1, rollNumber: 1 }, { unique: true });
studentCredentialSchema.index({ collegeId: 1, sectionId: 1, status: 1 });

export default mongoose.model('StudentCredential', studentCredentialSchema);
