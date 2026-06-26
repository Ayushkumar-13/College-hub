import mongoose from 'mongoose';

const domainAssignmentSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemCategory',
    required: true,
  },
  solverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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

domainAssignmentSchema.index({ collegeId: 1, categoryId: 1 }, { unique: true });

export default mongoose.model('DomainAssignment', domainAssignmentSchema);
