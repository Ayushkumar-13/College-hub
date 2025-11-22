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
    <div className="flex items-center justify-between p-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white shadow-sm">
      <div className="flex items-center gap-3">
        {isMobileView && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 active:scale-95"
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
          <h2 className="font-semibold text-slate-900">{selectedChat.name}</h2>
          <p className="text-xs text-slate-500">
            {typingUsers[selectedChat._id] ? (
              <span className="text-blue-500 font-medium">typing...</span>
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
