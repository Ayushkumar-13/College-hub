import express from 'express';
const router = express.Router();
import Course from '../models/Course.js';
import Branch from '../models/Branch.js';
import Section from '../models/Section.js';

router.get('/:id/branches', async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, isActive: true });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    const branches = await Branch.find({ courseId: course._id, isActive: true }).sort({ name: 1 });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
