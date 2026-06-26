import College from '../models/College.js';
import Course from '../models/Course.js';
import ProblemCategory from '../models/ProblemCategory.js';
import User from '../models/User.js';
import { getRegistrationCollegeWithMeta } from '../utils/collegeHelpers.js';

import express from 'express';
const router = express.Router();

// Single configured college (set in admin panel)
router.get('/', async (req, res) => {
  try {
    const college = await getRegistrationCollegeWithMeta();
    res.json([college]);
  } catch (error) {
    res.status(error.status || 503).json({ success: false, error: error.message });
  }
});

router.get('/:id/courses', async (req, res) => {
  try {
    const college = await College.findOne({ _id: req.params.id, isActive: true });
    if (!college) {
      return res.status(404).json({ success: false, error: 'College not found' });
    }
    const courses = await Course.find({ collegeId: college._id, isActive: true }).sort({ name: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/categories', async (req, res) => {
  try {
    const college = await College.findOne({ _id: req.params.id, isActive: true });
    if (!college) {
      return res.status(404).json({ success: false, error: 'College not found' });
    }
    const categories = await ProblemCategory.find({ collegeId: college._id, isActive: true }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/meta', async (req, res) => {
  try {
    const college = await College.findOne({ _id: req.params.id, isActive: true });
    if (!college) {
      return res.status(404).json({ success: false, error: 'College not found' });
    }
    const ownerExists = await User.exists({ collegeId: college._id, role: 'Owner' });
    res.json({
      _id: college._id,
      name: college.name,
      code: college.code,
      city: college.city,
      hasOwner: !!ownerExists,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
