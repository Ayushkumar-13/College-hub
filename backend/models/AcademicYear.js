import mongoose from 'mongoose';

const academicYearSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  label: {
    type: String,
    required: [true, 'Label is required'],
    trim: true,
  },
  startYear: {
    type: Number,
    required: true,
  },
  endYear: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isCurrent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

academicYearSchema.pre('save', function preSave(next) {
  if (this.startYear) {
    this.endYear = this.startYear + 1;
    this.label = `${this.startYear}-${this.endYear}`;
  }
  next();
});

academicYearSchema.index({ collegeId: 1, startYear: 1 }, { unique: true });

export default mongoose.model('AcademicYear', academicYearSchema);
