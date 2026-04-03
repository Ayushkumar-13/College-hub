// FILE: frontend/src/components/Messages/MessageBubble.jsx
/**
 * ✅ UPDATED: Only shows TIME in message bubble (not date)
 * ✅ Date separators handle dates above messages
 * ✅ Self-messages show blue double-check automatically
 */
import React from 'react';
import { 
  File, 
  Check, 
  CheckCheck, 
  AlertCircle,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  Clock
} from 'lucide-react';

// ✅ UPDATED: Only return TIME (not date)
const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  
  // Only show time in 12-hour format
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Detect if message is a call message
const isCallMessage = (text) => {
  if (!text) return null;
  
  const patterns = {
    audioCall: /📞.*(?:audio|voice)\s*call/i,
    videoCall: /📹.*video\s*call/i,
    missedCall: /📵.*missed.*call/i,
    incomingCall: /incoming.*call/i,
    outgoingCall: /outgoing.*call/i,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      const durationMatch = text.match(/(\d+m\s*\d+s|\d+s)/);
      const duration = durationMatch ? durationMatch[0] : null;
      
      return {
        type,
        duration,
        isAudio: type === 'audioCall' || text.includes('audio') || text.includes('voice'),
        isVideo: type === 'videoCall' || text.includes('video'),
        isMissed: type === 'missedCall',
        isIncoming: type === 'incomingCall',
        isOutgoing: type === 'outgoingCall',
      };
    }
  }

  return null;
};

// WhatsApp-Style Call Message Component
const CallMessageBubble = ({ callInfo, isSender, timestamp, status }) => {
  const { isAudio, isVideo, isMissed, isIncoming, isOutgoing, duration } = callInfo;

  const callColor = isMissed 
    ? 'text-red-500' 
    : isIncoming 
    ? 'text-green-600' 
    : 'text-blue-600';

  const bgColor = isMissed
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30'
    : isIncoming
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30'
    : isSender
    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30'
    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

  const CallIcon = isVideo ? Video : Phone;
  const DirectionIcon = isMissed 
    ? PhoneMissed 
    : isIncoming 
    ? PhoneIncoming 
    : PhoneOutgoing;

  const callLabel = isVideo 
    ? isOutgoing 
      ? 'Outgoing video call'
      : isIncoming
      ? 'Incoming video call'
      : isMissed
      ? 'Missed video call'
      : 'Video call'
    : isOutgoing
      ? 'Outgoing voice call'
      : isIncoming
      ? 'Incoming voice call'
      : isMissed
      ? 'Missed voice call'
      : 'Voice call';

  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${bgColor}
      transition-all duration-200 hover:shadow-md
      ${isSender ? 'rounded-br-md' : 'rounded-bl-md'}
      max-w-[280px]
    `}>
      <div className={`
        flex items-center justify-center w-10 h-10 rounded-full
        ${isMissed ? 'bg-red-100' : isIncoming ? 'bg-green-100' : 'bg-blue-100'}
      `}>
        <CallIcon size={20} className={callColor} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <DirectionIcon size={14} className={callColor} />
          <span className={`text-sm font-medium ${callColor}`}>
            {callLabel}
          </span>
        </div>
        
        {duration && (
          <div className="flex items-center gap-1 text-text-dim">
            <Clock size={12} />
            <span className="text-xs">{duration}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-1">
          {/* ✅ Only show time */}
          <p className="text-xs text-text-dim">
            {formatMessageTime(timestamp)}
          </p>
          {isSender && status && (
            <MessageStatus status={status} isSender={true} />
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ UPDATED: Message status with self-message support
const MessageStatus = ({ status, isSender, isSelfMessage }) => {
  if (!isSender) return null;

  // ✅ Self-messages always show as "read" with blue checks
  const effectiveStatus = isSelfMessage ? 'read' : status;

  return (
    <div className="flex items-center justify-end min-w-[16px]">
      {effectiveStatus === 'queued' && (
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-yellow-500 animate-pulse" />
        </div>
      )}
      {effectiveStatus === 'sending' && (
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin"></div>
        </div>
      )}
      {effectiveStatus === 'failed' && <AlertCircle size={14} className="text-red-500" />}
      {effectiveStatus === 'sent' && (
        <Check size={14} className="text-slate-400 transition-all duration-200" />
      )}
      {effectiveStatus === 'delivered' && (
        <CheckCheck size={14} className="text-slate-500 transition-all duration-200" />
      )}
      {effectiveStatus === 'read' && (
        <CheckCheck
          size={14}
          className="text-blue-500 transition-all duration-200 drop-shadow-[0_0_3px_rgba(59,130,246,0.5)]"
        />
      )}
    </div>
  );
};

const MessageBubble = ({ 
  message, 
  isSender,
  isSelfMessage = false, // ✅ NEW: Flag for self-messages
  senderAvatar, 
  receiverAvatar,
  onRetry 
}) => {
  const callInfo = isCallMessage(message.text);

  // ✅ Call message rendering
  if (callInfo) {
    return (
      <div
        className={`flex ${isSender ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
      >
        {!isSender && (
          <img
            src={receiverAvatar}
            alt="Receiver"
            className="w-8 h-8 rounded-full object-cover mr-2 mt-auto mb-1 flex-shrink-0 shadow-sm"
          />
        )}
        
        <CallMessageBubble 
          callInfo={callInfo}
          isSender={isSender}
          timestamp={message.createdAt}
          status={message.status}
        />

        {isSender && (
          <img
            src={senderAvatar}
            alt="Sender"
            className="w-8 h-8 rounded-full object-cover ml-2 mt-auto mb-1 flex-shrink-0 shadow-sm ring-2 ring-white"
          />
        )}
      </div>
    );
  }

  // ✅ Regular message bubble
  return (
    <div
      className={`flex ${isSender ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      {!isSender && !isSelfMessage && (
        <img
          src={receiverAvatar}
          alt="Receiver"
          className="w-8 h-8 rounded-full object-cover mr-2 mt-auto mb-1 flex-shrink-0 shadow-sm"
        />
      )}
      
      <div
        onClick={() => message.status === 'failed' && onRetry ? onRetry() : null}
        className={`relative max-w-[70%] px-4 py-2 shadow-sm break-words transition-all duration-300 hover:shadow-md group ${
          isSender || isSelfMessage
            ? message.status === 'failed'
              ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-800 text-text-main rounded-2xl rounded-br-md cursor-pointer hover:bg-red-200 transition-colors'
              : message.status === 'queued'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-800 text-text-main rounded-2xl rounded-br-md'
              : 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-2xl rounded-br-md'
            : 'bg-surface dark:bg-slate-800 text-text-main border border-border-card rounded-2xl rounded-bl-md'
        }`}
      >
        {/* Queued Badge */}
        {message.status === 'queued' && (isSender || isSelfMessage) && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-medium shadow-sm flex items-center gap-1">
            <Clock size={10} />
            <span>Queued</span>
          </div>
        )}

        {/* Failed Badge */}
        {message.status === 'failed' && (isSender || isSelfMessage) && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm flex items-center gap-1 animate-pulse">
            <AlertCircle size={10} />
            <span>Failed</span>
          </div>
        )}

        {message.text && (
          <p className="whitespace-pre-wrap leading-relaxed text-sm">
            {message.text}
          </p>
        )}

        {message.media?.length > 0 && (
          <div
            className={`${message.text ? 'mt-2' : ''} ${
              message.media.length === 1 ? 'w-full' : 'grid grid-cols-2 gap-2'
            }`}
          >
            {message.media.map((file, i) =>
              file.type === 'image' ? (
                <div key={i} className="relative group/image overflow-hidden rounded-xl">
                  <img
                    src={file.url}
                    alt="attachment"
                    className="max-h-60 w-full object-cover transition-transform duration-300 group-hover/image:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
                </div>
              ) : (
                <a
                  key={i}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-200 border ${
                    isSender || isSelfMessage
                      ? 'bg-blue-400/20 hover:bg-blue-400/30 border-blue-300/30'
                      : 'bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 border-border-card'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    isSender || isSelfMessage ? 'bg-white/20' : 'bg-slate-200'
                  }`}>
                    <File
                      size={16}
                      className={isSender || isSelfMessage ? 'text-white' : 'text-slate-600'}
                    />
                  </div>
                  <span className="text-xs truncate flex-1 font-medium">
                    {file.filename || 'File'}
                  </span>
                </a>
              )
            )}
          </div>
        )}

        <div
          className={`flex items-center gap-1.5 mt-1 ${
            isSender || isSelfMessage ? 'justify-end' : 'justify-start'
          }`}
        >
          <p
            className={`text-xs transition-colors ${
              isSender || isSelfMessage
                ? message.status === 'queued' 
                  ? 'text-yellow-700 dark:text-yellow-500'
                  : message.status === 'failed'
                  ? 'text-red-700 dark:text-red-500'
                  : 'text-blue-100/80'
                : 'text-text-dim'
            }`}
          >
            {formatMessageTime(message.createdAt)}
          </p>
          <MessageStatus 
            status={message.status} 
            isSender={isSender || isSelfMessage}
            isSelfMessage={isSelfMessage}
          />
        </div>

        {/* Failed message UI */}
        {message.status === 'failed' && (isSender || isSelfMessage) && (
          <div className="mt-2 pt-2 border-t border-red-300/50 flex items-center justify-center gap-2 text-xs text-red-600 font-medium">
            <AlertCircle size={14} />
            <span>Message will retry automatically when online</span>
          </div>
        )}

        {/* Queued message info */}
        {message.status === 'queued' && (isSender || isSelfMessage) && (
          <div className="mt-2 pt-2 border-t border-yellow-300/50 flex items-center justify-center gap-2 text-xs text-yellow-700 font-medium">
            <Clock size={14} />
            <span>Will send when connected</span>
          </div>
        )}
      </div>

      {(isSender || isSelfMessage) && (
        <img
          src={senderAvatar}
          alt="Sender"
          className="w-8 h-8 rounded-full object-cover ml-2 mt-auto mb-1 flex-shrink-0 shadow-sm ring-2 ring-surface dark:ring-slate-800 transition-all"
        />
      )}
    </div>
  );
};

export default MessageBubble;