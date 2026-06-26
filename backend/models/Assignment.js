import mongoose from 'mongoose';
const ASSIGNMENT_TYPES = ['SectionCoordinator', 'HOD', 'Director', 'DomainSolver'];

const assignmentSchema = new mongoose.Schema({
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
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    default: null,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
  },
  year: {
    type: Number,
    default: null,
    min: 1,
    max: 6,
  },
  semester: {
    type: Number,
    enum: [1, 2],
    default: 1,
  },
  type: {
    type: String,
    enum: ASSIGNMENT_TYPES,
    required: true,
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    default: null,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  problemCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemCategory',
    default: null,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

assignmentSchema.index(
  { collegeId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'Director' } }
);
assignmentSchema.index(
  { branchId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'HOD' } }
);
assignmentSchema.index(
  { sectionId: 1, sessionId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'SectionCoordinator' } }
);
assignmentSchema.index(
  { problemCategoryId: 1, type: 1, userId: 1 },
  { unique: true, partialFilterExpression: { type: 'DomainSolver' } }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);
export { ASSIGNMENT_TYPES };
export default Assignment;
