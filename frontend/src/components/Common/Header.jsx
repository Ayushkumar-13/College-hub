import React from 'react';
import { ArrowLeft, Phone, Video } from 'lucide-react';

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

      <div className="flex gap-2">
        <button
          className="p-2.5 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 active:scale-95 shadow-sm"
          title="Audio Call"
        >
          <Phone size={18} className="text-blue-600" />
        </button>
        <button
          className="p-2.5 rounded-full bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-200 active:scale-95 shadow-sm"
          title="Video Call"
        >
          <Video size={18} className="text-green-600" />
        </button>
      </div>
    </div>
  );
};

export default Header;