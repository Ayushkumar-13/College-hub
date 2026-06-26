import mongoose from 'mongoose';

const problemCategorySchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
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

problemCategorySchema.index({ collegeId: 1, name: 1 }, { unique: true });

export default mongoose.model('ProblemCategory', problemCategorySchema);
