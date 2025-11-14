/*
 * FILE: backend/routes/messages.js
 * PURPOSE: Message routes (fetch, send, read, latest chats)
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

/* -------------------------------------------------------------------------- */
/*               ⭐ NEW IMPORTANT ROUTE: LATEST CHAT LIST API ⭐                */
/* -------------------------------------------------------------------------- */
// @route   GET /api/messages/chats
// @desc    Fetch users with whom the logged-in user has chatted + last message
// @access  Private
router.get('/chats/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userId] },
              "$receiverId",
              "$senderId"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    const populatedChats = await Promise.all(
      chats.map(async (chat) => {
        const user = await User.findById(chat._id).select("name avatar email");
        return {
          user,
          lastMessage: chat.lastMessage
        };
      })
    );

    res.status(200).json(populatedChats);
  } catch (error) {
    console.error("❌ Chat list error:", error);
    res.status(500).json({ error: "Failed to fetch chat list" });
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

    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/* -------------------- SEND A MESSAGE -------------------- */
router.post('/', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId) return res.status(400).json({ error: 'Receiver ID is required' });

    const media = [];

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

    newMessage.status = 'sent';
    await newMessage.save();

    io?.to(req.user.id)?.emit('message:status', {
      messageId: newMessage._id,
      status: 'sent'
    });

    if (receiverOnline) {
      newMessage.status = 'delivered';
      await newMessage.save();

      io?.to(req.user.id)?.emit('message:status', {
        messageId: newMessage._id,
        status: 'delivered'
      });

      io?.to(receiverId)?.emit('message:receive', newMessage);
    }

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
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (String(message.receiverId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    message.read = true;
    message.status = 'read';
    await message.save();

    const io = req.app.get('io');
    io?.to(message.senderId.toString()).emit('message:status', {
      messageId: message._id,
      status: 'read'
    });

    res.json({ message: 'Message marked as read', id: message._id });
  } catch (error) {
    console.error('❌ Mark read error:', error);
    res.status(500).json({ error: 'Failed to update message read status' });
  }
});

/* -------------------- SEARCH MESSAGES -------------------- */
router.get('/search/query', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') return res.status(400).json({ error: 'Query is required' });

    const userId = req.user.id;
    const regex = new RegExp(q, 'i');

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
