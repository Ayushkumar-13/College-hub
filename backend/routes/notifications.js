/*
 * FILE: backend/routes/notifications.js
 * PURPOSE: Notification routes (get, mark read, unread count)
 */

import express from 'express';
const router = express.Router();
import authenticateToken from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import { emitUnreadCount } from '../utils/notificationService.js';

router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const notifications = await Notification.find({ userId: req.user.id })
      .populate('fromUser', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
    });
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    const io = req.app.get('io');
    await emitUnreadCount(io, req.user.id);

    res.json({ message: 'All notifications marked as read', count: 0 });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();

      const io = req.app.get('io');
      await emitUnreadCount(io, req.user.id);
    }

    const populated = await Notification.findById(notification._id)
      .populate('fromUser', 'name avatar role');

    res.json(populated);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
