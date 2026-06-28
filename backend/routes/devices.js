import express from 'express';
import DeviceToken from '../models/DeviceToken.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { token, platform = 'android' } = req.body;
    if (!token?.trim()) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    const safePlatform = ['ios', 'android', 'web'].includes(platform) ? platform : 'android';

    await DeviceToken.findOneAndUpdate(
      { token: token.trim() },
      { userId: req.user.id, platform: safePlatform, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Device register error:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

router.delete('/unregister', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token?.trim()) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    await DeviceToken.deleteOne({ token: token.trim(), userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    console.error('Device unregister error:', error);
    res.status(500).json({ error: 'Failed to unregister device' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const devices = await DeviceToken.find({ userId: req.user.id })
      .select('platform updatedAt')
      .sort({ updatedAt: -1 });
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

export default router;
