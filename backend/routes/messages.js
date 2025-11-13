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

    // Upload media files (if any)
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

    // Step 1: Create message with `sending` status
    let newMessage = new Message({
      senderId: req.user.id,
      receiverId,
      text: text || '',
      media,
      status: 'sending'
    });

    await newMessage.save();

    const io = req.app.get('io');
    const receiverOnline = io?.isUserOnline(receiverId);

    // Step 2: Update message status to `sent`
    newMessage.status = 'sent';
    await newMessage.save();

    // Step 3: Notify sender (confirm message sent)
    io?.to(req.user.id)?.emit('message:status', {
      messageId: newMessage._id,
      status: 'sent'
    });

    // Step 4: If receiver online, mark as `delivered`
    if (receiverOnline) {
      newMessage.status = 'delivered';
      await newMessage.save();

      io?.to(req.user.id)?.emit('message:status', {
        messageId: newMessage._id,
        status: 'delivered'
      });

      io?.to(receiverId)?.emit('message:receive', newMessage);
    }

    // Step 5: Create notification
    const senderUser = await User.findById(req.user.id);
    if (senderUser) {
      const notification = new Notification({
        userId: receiverId,
        type: 'message',
        fromUser: req.user.id,
        message: `${senderUser.name} sent you a message`
      });
      await notification.save();

      io?.to(receiverId)?.emit('notification:receive', notification);
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
    message.status = 'read';
    await message.save();

    const io = req.app.get('io');
    io?.to(message.senderId.toString()) ?.emit('message:status', {
      messageId: message._id,
      status: 'read'
    });

    res.json({ message: 'Message marked as read', id: message._id });
  } catch (error) {
    console.error('❌ Mark read error:', error);
    res.status(500).json({ error: 'Failed to update message read status' });
  }
});

// @route   GET /api/messages/search?q=keyword
// @desc    Search messages by text content for logged-in user
// @access  Private
router.get('/search/query', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') return res.status(400).json({ error: 'Query is required' });

    const userId = req.user.id;
    const regex = new RegExp(q, 'i'); // case-insensitive search

    const messages = await Message.find({
      $and: [
        { text: regex },
        { $or: [{ senderId: userId }, { receiverId: userId }] }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar');

    res.json(messages);
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

module.exports = router;
