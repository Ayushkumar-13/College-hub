/*
 * FILE: backend/routes/messages.js
 * PURPOSE: Message routes (fetch, send, and read messages)
 */

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

/* -------------------- Helper: Upload to Cloudinary -------------------- */
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

/* -------------------- GET MESSAGES BETWEEN TWO USERS -------------------- */
// @route   GET /api/messages/:userId
// @desc    Fetch all messages between logged-in user and target user
// @access  Private
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar');

    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/* -------------------- SEND A MESSAGE -------------------- */
// @route   POST /api/messages
// @desc    Send a new message (with optional media)
// @access  Private
router.post('/', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId) return res.status(400).json({ error: 'Receiver ID is required' });

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

    // Create and save message
    const newMessage = new Message({
      senderId: req.user.id,
      receiverId,
      text: text || '',
      media
    });

    await newMessage.save();

    // Notify receiver
    const senderUser = await User.findById(req.user.id);
    if (senderUser) {
      const notification = new Notification({
        userId: receiverId,
        type: 'message',
        fromUser: req.user.id,
        message: `${senderUser.name} sent you a message`
      });
      await notification.save();

      // Socket.io real-time updates
      const io = req.app.get('io');
      if (io) {
        io.to(receiverId).emit('newMessage', newMessage);
        io.to(receiverId).emit('notification', notification);
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/* -------------------- MARK MESSAGE AS READ -------------------- */
// @route   PATCH /api/messages/:id/read
// @desc    Mark specific message as read
// @access  Private
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Allow only receiver to mark as read
    if (String(message.receiverId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    message.read = true;
    await message.save();

    res.json({ message: 'Message marked as read', id: message._id });
  } catch (error) {
    console.error('❌ Mark read error:', error);
    res.status(500).json({ error: 'Failed to update message read status' });
  }
});

module.exports = router;
