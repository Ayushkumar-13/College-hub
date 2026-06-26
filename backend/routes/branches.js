import express from 'express';
const router = express.Router();
import Branch from '../models/Branch.js';
import Section from '../models/Section.js';

router.get('/:id/sections', async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, isActive: true });
    if (!branch) {
      return res.status(404).json({ success: false, error: 'Branch not found' });
    }
    const filter = { branchId: branch._id, isActive: true };
    if (req.query.year) filter.year = Number(req.query.year);
    const sections = await Section.find(filter).sort({ year: 1, name: 1 });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
