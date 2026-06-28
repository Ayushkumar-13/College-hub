export function formatCallDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function parseCallMessage(message) {
  if (!message) return null;

  if (message.messageType === 'call') {
    const isVideo = message.callType === 'video';
    const isMissed = message.callStatus === 'missed' || message.callStatus === 'rejected';
    const duration = message.callDuration > 0
      ? formatCallDuration(message.callDuration)
      : null;

    return {
      isVideo,
      isMissed,
      duration,
      callStatus: message.callStatus || 'completed',
    };
  }

  const text = message.text;
  if (!text) return null;

  const isVideo = /📹|video/i.test(text);
  const isAudio = /📞|voice|audio/i.test(text);
  if (!isVideo && !isAudio) return null;

  const isMissed = /missed|declined|📵/i.test(text);
  const durationMatch = text.match(/(\d+m\s*\d+s|\d+s)/);
  const duration = durationMatch ? durationMatch[0] : null;

  return {
    isVideo,
    isMissed,
    duration,
    callStatus: isMissed ? 'missed' : 'completed',
  };
}

export function getCallLabel({ isVideo, isMissed, isSender, callStatus }) {
  const kind = isVideo ? 'video' : 'voice';

  if (isMissed || callStatus === 'missed' || callStatus === 'rejected') {
    return `Missed ${kind} call`;
  }

  return isSender ? `Outgoing ${kind} call` : `Incoming ${kind} call`;
}
