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
    <div className="border-t border-slate-200/80 p-4 bg-white/80 backdrop-blur-sm">
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current.click()}
          className="p-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-all duration-200 flex-shrink-0 active:scale-95"
          title="Attach files"
        >
          <Paperclip size={20} className="text-slate-600" />
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
            className="w-full resize-none px-4 py-3 rounded-2xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white placeholder:text-slate-400"
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