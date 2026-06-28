import Message from '../models/Message.js';

export function formatCallDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function formatCallLogText(callType, duration, callStatus) {
  const isVideo = callType === 'video';
  const icon = isVideo ? '📹' : '📞';
  const label = isVideo ? 'Video' : 'Voice';

  if (callStatus === 'missed') return `${icon} Missed ${label.toLowerCase()} call`;
  if (callStatus === 'rejected') return `${icon} Declined ${label.toLowerCase()} call`;
  if (callStatus === 'cancelled') return `${icon} ${label} call`;

  return `${icon} ${label} call • ${formatCallDuration(duration)}`;
}

/**
 * Persist a call log entry in the chat thread (caller = sender, callee = receiver).
 */
export async function saveCallLogMessage(io, {
  callerId,
  receiverId,
  callType,
  duration = 0,
  callStatus,
}) {
  if (!callerId || !receiverId) return null;

  const normalizedType = callType === 'video' ? 'video' : 'audio';
  const status = callStatus || (duration > 0 ? 'completed' : 'cancelled');

  const message = await Message.create({
    senderId: callerId,
    receiverId,
    messageType: 'call',
    callType: normalizedType,
    callDuration: Math.max(0, Math.floor(duration || 0)),
    callStatus: status,
    text: formatCallLogText(normalizedType, duration, status),
    status: 'delivered',
    read: false,
  });

  await message.populate('senderId', 'name avatar');
  await message.populate('receiverId', 'name avatar');

  if (io) {
    io.to(`user:${callerId}`).emit('message:new', message);
    io.to(`user:${receiverId}`).emit('message:new', message);
    io.to(`user:${callerId}`).emit('message:status', {
      messageId: message._id,
      status: 'delivered',
      message,
    });
  }

  return message;
}
