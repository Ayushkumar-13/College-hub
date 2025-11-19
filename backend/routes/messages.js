/*
 * FILE: backend/routes/messages.js
 * PURPOSE: Message routes - FIXED VERSION with proper error handling
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

/* -------------------- Helper: isUserOnline -------------------- */
const isUserOnline = (io, userId) => {
  try {
    if (!io) return false;
    const room = io.sockets.adapter.rooms.get(`user:${userId}`);
    return Boolean(room && room.size > 0);
  } catch (err) {
    return false;
  }
};

/* -------------------- LATEST CHAT LIST -------------------- */
router.get('/chats/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Message.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    const populated = await Promise.all(
      chats.map(async (c) => {
        const u = await User.findById(c._id).select('name avatar email');
        return { user: u, lastMessage: c.lastMessage };
      })
    );

    return res.status(200).json(populated);
  } catch (err) {
    console.error('❌ Chat list error:', err);
    return res.status(500).json({ error: 'Failed to fetch chat list' });
  }
});

/* -------------------- SEARCH MESSAGES -------------------- */
router.get('/search/query', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const userId = req.user.id;
    const regex = new RegExp(q, 'i');

    const result = await Message.find({
      text: regex,
      $or: [{ senderId: userId }, { receiverId: userId }]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar');

    return res.json(result);
  } catch (err) {
    console.error('❌ Search error:', err);
    return res.status(500).json({ error: 'Failed to search messages' });
  }
});

/* -------------------- GET MESSAGES BETWEEN TWO USERS -------------------- */
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

    return res.status(200).json(messages);
  } catch (err) {
    console.error('❌ Get messages error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
  }
});

/* -------------------- SEND A MESSAGE -------------------- */
router.post('/', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    console.log('📨 Incoming message request:', {
      body: req.body,
      files: req.files?.length || 0,
      user: req.user.id
    });

    const { receiverId, text } = req.body;

    // Validation
    if (!receiverId) {
      console.error('❌ Missing receiverId');
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (!text && (!req.files || req.files.length === 0)) {
      console.error('❌ Empty message');
      return res.status(400).json({ error: 'Message text or media required' });
    }

    const io = req.app.get('io');

    // Process media uploads
    const media = [];
    if (req.files && req.files.length > 0) {
      console.log(`📎 Processing ${req.files.length} media files...`);
      
      for (const file of req.files) {
        try {
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
          
          console.log(`✅ Uploaded: ${file.originalname}`);
        } catch (uplErr) {
          console.error('⚠️ Cloudinary upload failed:', file.originalname, uplErr.message);
        }
      }
    }

    // Create message in DB
    let newMessage = new Message({
      senderId: req.user.id,
      receiverId,
      text: text || '',
      media,
      status: 'sending'
    });

    await newMessage.save();
    console.log('💾 Message saved with ID:', newMessage._id);

    // Update to 'sent'
    newMessage.status = 'sent';
    await newMessage.save();

    // Populate sender/receiver info
    await newMessage.populate('senderId', 'name avatar');
    await newMessage.populate('receiverId', 'name avatar');

    // Emit to sender
    if (io) {
      io.to(`user:${req.user.id}`).emit('message:status', {
        messageId: newMessage._id,
        status: 'sent',
        message: newMessage
      });
      console.log(`📤 Emitted 'sent' status to sender: ${req.user.id}`);
    }

    // Check if receiver is online
    const receiverOnline = isUserOnline(io, receiverId);
    console.log(`🔍 Receiver ${receiverId} online: ${receiverOnline}`);

    if (receiverOnline) {
      // Mark as delivered
      newMessage.status = 'delivered';
      await newMessage.save();

      // Notify sender about delivery
      io.to(`user:${req.user.id}`).emit('message:status', {
        messageId: newMessage._id,
        status: 'delivered',
        message: newMessage
      });
      console.log(`✅ Emitted 'delivered' status to sender`);

      // Send message to receiver
      io.to(`user:${receiverId}`).emit('message:new', newMessage);
      console.log(`📨 Emitted 'message:new' to receiver: ${receiverId}`);
    }

    // Create notification
    try {
      const senderUser = await User.findById(req.user.id).select('name avatar');
      if (senderUser) {
        const notification = new Notification({
          userId: receiverId,
          type: 'message',
          fromUser: req.user.id,
          message: `${senderUser.name} sent you a message`
        });
        await notification.save();

        if (io && receiverOnline) {
          io.to(`user:${receiverId}`).emit('notification:new', notification);
          console.log(`🔔 Notification sent to receiver`);
        }
      }
    } catch (notifErr) {
      console.error('⚠️ Notification error:', notifErr.message);
    }

    console.log('✅ Message sent successfully');
    return res.status(201).json(newMessage);

  } catch (err) {
    console.error('❌ Send message error:', err);
    return res.status(500).json({ 
      error: 'Failed to send message',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/* -------------------- MARK MESSAGE AS READ -------------------- */
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (String(message.receiverId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    message.read = true;
    message.status = 'read';
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${message.senderId}`).emit('message:status', {
        messageId: message._id,
        status: 'read',
        messageIdOnly: true
      });
    }

    return res.json({ message: 'Message marked as read', id: message._id });
  } catch (err) {
    console.error('❌ Mark read error:', err);
    return res.status(500).json({ error: 'Failed to update message read status' });
  }
});

module.exports = router;