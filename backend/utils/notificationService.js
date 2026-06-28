import Notification from '../models/Notification.js';
import DeviceToken from '../models/DeviceToken.js';

async function emitToUser(io, recipientId, populated, count) {
  if (!io) return;
  io.to(`user:${recipientId}`).emit('notification:new', populated);
  io.to(`user:${recipientId}`).emit('notification:count', { count });
}

export async function sendExpoPush(userId, { title, body, data }) {
  try {
    const tokens = await DeviceToken.find({ userId }).select('token');
    if (!tokens.length) return;

    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title: title || 'College Social',
      body: body || 'You have a new notification',
      data: data || {},
      badge: typeof data?.badge === 'number' ? data.badge : undefined,
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error('Expo push failed:', response.status, await response.text());
    }
  } catch (err) {
    console.error('Expo push error:', err.message);
  }
}

/**
 * Create or update a notification, populate actor, push real-time + mobile push.
 */
export async function sendNotification(io, {
  userId,
  type,
  fromUser,
  message,
  title,
  postId,
  issueId,
  relatedUserId,
  commentId,
}) {
  if (!userId || !message || !type) return null;

  const recipientId = userId.toString();
  const senderId = fromUser?.toString?.() || fromUser || null;

  if (senderId && senderId === recipientId) return null;

  let notification;

  if (type === 'message' && senderId) {
    const existing = await Notification.findOne({
      userId: recipientId,
      type: 'message',
      relatedUserId: senderId,
      read: false,
    }).sort({ createdAt: -1 });

    if (existing) {
      existing.message = message;
      existing.title = title || message;
      existing.createdAt = new Date();
      await existing.save();
      notification = existing;
    }
  }

  if (!notification) {
    notification = await Notification.create({
      userId: recipientId,
      type,
      fromUser: senderId,
      message,
      title: title || message,
      postId: postId || null,
      issueId: issueId || null,
      relatedUserId: relatedUserId || senderId || null,
      commentId: commentId || null,
    });
  }

  const populated = await Notification.findById(notification._id)
    .populate('fromUser', 'name avatar role');

  const count = await Notification.countDocuments({ userId: recipientId, read: false });

  await emitToUser(io, recipientId, populated, count);

  await sendExpoPush(recipientId, {
    title: populated.title || 'College Social',
    body: populated.message,
    data: {
      notificationId: populated._id.toString(),
      type: populated.type,
      postId: populated.postId?.toString?.() || populated.postId || null,
      issueId: populated.issueId?.toString?.() || populated.issueId || null,
      relatedUserId: populated.relatedUserId?.toString?.() || populated.relatedUserId || null,
      message: populated.message,
      title: populated.title,
      badge: count,
    },
  });

  return populated;
}

export async function emitUnreadCount(io, userId) {
  if (!io || !userId) return;
  const count = await Notification.countDocuments({ userId, read: false });
  io.to(`user:${userId}`).emit('notification:count', { count });
}
