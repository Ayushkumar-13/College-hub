import express from 'express';
const router = express.Router();
import authenticateToken from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/authorize.js';
import College from '../models/College.js';

router.use(authenticateToken, requireSuperAdmin);

router.post('/colleges', async (req, res) => {
  try {
    const existing = await College.countDocuments();
    if (existing >= 1) {
      return res.status(400).json({
        success: false,
        error: 'Only one college is allowed. Edit the existing college in the admin panel.',
      });
    }
    const { name, code, address, city, logo } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Name and code are required' });
    }
    const college = await College.create({ name, code, address, city, logo });
    res.status(201).json(college);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
