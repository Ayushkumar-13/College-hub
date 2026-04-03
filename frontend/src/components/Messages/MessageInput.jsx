import React, { useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import FileUpload from '../Common/FileUpload';

const MessageInput = ({
  messageText,
  messageFiles,
  sending,
  onMessageChange,
  onKeyPress,
  onSend,
  onFileSelect,
  onFileRemove,
}) => {
  const fileInputRef = useRef(null);

  return (
    <div className="border-t border-border-card p-4 bg-surface dark:bg-slate-900/80 backdrop-blur-sm transition-colors duration-300">
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current.click()}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-all duration-200 flex-shrink-0 active:scale-95"
          title="Attach files"
        >
          <Paperclip size={20} className="text-text-dim" />
        </button>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={onFileSelect}
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />

        <div className="flex-1 relative">
          <FileUpload files={messageFiles} onRemove={onFileRemove} />

          <textarea
            value={messageText}
            onChange={onMessageChange}
            onKeyDown={onKeyPress}
            rows={1}
            disabled={sending}
            placeholder="Type a message..."
            className="w-full resize-none px-4 py-3 rounded-2xl border border-border-card focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100/20 outline-none transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 dark:bg-slate-800 text-text-main placeholder:text-text-dim/60"
            style={{ maxHeight: '120px', minHeight: '44px' }}
          />
        </div>

        <button
          onClick={onSend}
          disabled={sending || (!messageText.trim() && messageFiles.length === 0)}
          className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 shadow-lg active:scale-95 ${
            sending || (!messageText.trim() && messageFiles.length === 0)
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl'
          }`}
          title="Send message"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;