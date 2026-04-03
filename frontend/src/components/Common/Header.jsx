import React from 'react';
import { ArrowLeft } from 'lucide-react';

const Header = ({ 
  selectedChat, 
  typingUsers, 
  onBack, 
  isMobileView 
}) => {
  if (!selectedChat) return null;

  return (
    <div className="flex items-center justify-between p-4 border-b border-border-card bg-surface dark:bg-slate-900 shadow-sm ">
      <div className="flex items-center gap-3">
        {isMobileView && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-text-dim hover:text-text-main transition-all duration-200 active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <img
          src={
            selectedChat.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.name}`
          }
          alt={selectedChat.name}
          className="w-11 h-11 rounded-full object-cover shadow-md"
        />
        <div>
          <h2 className="font-semibold text-text-main">{selectedChat.name}</h2>
          <p className="text-xs text-text-dim">
            {typingUsers[selectedChat._id] ? (
              <span className="text-blue-500 font-semibold animate-pulse">typing...</span>
            ) : (
              selectedChat.role || 'User'
            )}
          </p>
        </div>
      </div>

      {/* 🔥 Removed audio + video buttons here */}
    </div>
  );
};

export default Header;
