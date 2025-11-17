import React from 'react';
import { File, Check, CheckCheck, AlertCircle } from 'lucide-react';

// Helper: format message timestamp
const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return (
      'Yesterday ' +
      date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    );
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Message status indicator component
const MessageStatus = ({ status, isSender }) => {
  if (!isSender) return null;

  return (
    <div className="flex items-center justify-end min-w-[16px]">
      {status === 'sending' && (
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 rounded-full border-2 border-blue-200 border-t-transparent animate-spin"></div>
        </div>
      )}
      {status === 'failed' && <AlertCircle size={14} className="text-red-400" />}
      {status === 'sent' && (
        <Check size={14} className="text-blue-200 transition-all duration-200" />
      )}
      {status === 'delivered' && (
        <CheckCheck size={14} className="text-blue-300 transition-all duration-200" />
      )}
      {status === 'read' && (
        <CheckCheck
          size={14}
          className="text-blue-400 transition-all duration-200 drop-shadow-[0_0_3px_rgba(96,165,250,0.5)]"
        />
      )}
    </div>
  );
};

const MessageBubble = ({ 
  message, 
  isSender, 
  senderAvatar, 
  receiverAvatar,
  onRetry 
}) => {
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
      <div
        onClick={() => message.status === 'failed' && onRetry ? onRetry() : null}
        className={`max-w-[70%] px-3 py-2 shadow-md break-words transition-all duration-200 hover:shadow-lg group ${
          isSender
            ? message.status === 'failed'
              ? 'bg-red-50 border-2 border-red-200 text-slate-800 rounded-2xl rounded-br-md cursor-pointer hover:bg-red-100'
              : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md'
            : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-md'
        }`}
      >
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
                <div key={i} className="relative group/image">
                  <img
                    src={file.url}
                    alt="attachment"
                    className="rounded-xl max-h-60 w-full object-cover transition-transform duration-200 group-hover/image:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 rounded-xl transition-colors duration-200" />
                </div>
              ) : (
                <a
                  key={i}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                    isSender
                      ? 'bg-blue-400/20 hover:bg-blue-400/30'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <File
                    size={16}
                    className={isSender ? 'text-white' : 'text-slate-600'}
                  />
                  <span className="text-xs truncate">
                    {file.filename || 'File'}
                  </span>
                </a>
              )
            )}
          </div>
        )}

        <div
          className={`flex items-center gap-1.5 mt-1 ${
            isSender ? 'justify-end' : 'justify-start'
          }`}
        >
          <p
            className={`text-xs ${
              isSender ? 'text-blue-100' : 'text-slate-400'
            }`}
          >
            {formatMessageTime(message.createdAt)}
          </p>
          <MessageStatus status={message.status} isSender={isSender} />
        </div>

        {message.status === 'failed' && isSender && (
          <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
            <AlertCircle size={12} />
            <span>Tap to retry</span>
          </div>
        )}
      </div>

      {isSender && (
        <img
          src={senderAvatar}
          alt="Sender"
          className="w-8 h-8 rounded-full object-cover ml-2 mt-auto mb-1 flex-shrink-0 shadow-sm"
        />
      )}
    </div>
  );
};

export default MessageBubble;