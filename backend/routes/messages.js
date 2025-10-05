/*
 * FILE: backend/routes/messages.js
 * LOCATION: college-social-platform/backend/routes/messages.js
 * PURPOSE: Message routes (send messages, get conversations)
 */

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper function to upload to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: `college-social/${folder}` },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// @route   GET /api/messages/:userId
// @desc    Get all messages between current user and another user
// @access  Private
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar');

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const media = [];

    // Upload media files to Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'messages');
        
        let fileType = 'document';
        if (file.mimetype.startsWith('image')) fileType = 'image';
        else if (file.mimetype.startsWith('video')) fileType = 'video';

        media.push({
          type: fileType,
          url: result.secure_url,
          publicId: result.public_id,
          filename: file.originalname
        });
      }
    }

    // Create message
    const message = new Message({
      senderId: req.user.id,
      receiverId,
      text: text || '',
      media
    });

    await message.save();

    // Create notification
    const user = await User.findById(req.user.id);
    const notification = new Notification({
      userId: receiverId,
      type: 'message',
      fromUser: req.user.id,
      message: `${user.name} sent you a message`
    });
    await notification.save();

    // Emit socket events
    const io = req.app.get('io');
    io.to(receiverId).emit('message', message);
    io.to(receiverId).emit('notification', notification);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.read = true;
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;