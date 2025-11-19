import React from 'react';
import { Search, MessageSquare, AlertTriangle, TrendingUp } from 'lucide-react';

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

const ChatList = ({
  conversations,
  selectedChat,
  searchQuery,
  searchResults,
  isSearching,
  onSelectChat,
  onSearchChange,
}) => {
  const [recentlyUpdated, setRecentlyUpdated] = React.useState(new Set());

  // Track recently updated conversations
  React.useEffect(() => {
    const updated = new Set();
    conversations.forEach((conv, index) => {
      if (index === 0 && conv.latestMessage) {
        const messageTime = new Date(conv.latestMessage.createdAt).getTime();
        const now = Date.now();
        // If message is less than 3 seconds old, mark as recently updated
        if (now - messageTime < 3000) {
          updated.add(conv.user._id);
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setRecentlyUpdated((prev) => {
              const newSet = new Set(prev);
              newSet.delete(conv.user._id);
              return newSet;
            });
          }, 3000);
        }
      }
    });
    if (updated.size > 0) {
      setRecentlyUpdated(updated);
    }
  }, [conversations]);

  return (
    <aside className="lg:col-span-4 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden backdrop-blur-sm">
      <div className="p-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white">
        <div className="relative">
          <Search
            size={18}
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
              isSearching ? 'text-blue-500 animate-pulse' : 'text-slate-400'
            }`}
          />
          <input
            type="text"
            placeholder="Search conversations or messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 text-sm placeholder:text-slate-400"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        {searchQuery && searchResults.length > 0 && (
          <div className="mt-2 text-xs text-slate-500">
            Found {searchResults.length} message{searchResults.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="overflow-y-auto h-[calc(100vh-220px)] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            {searchQuery ? (
              <>
                <Search size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No results found</p>
                <p className="text-sm mt-2">Try different keywords</p>
              </>
            ) : (
              <>
                <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm mt-2">
                  Start messaging people and they'll appear here.
                </p>
              </>
            )}
          </div>
        ) : (
          conversations.map(({ user: u, latestMessage, unreadCount }) => {
            const isSelected = selectedChat?._id === u._id;
            const isRecentlyUpdated = recentlyUpdated.has(u._id);
            
            // Check if this is an escalated message
            const isEscalated = latestMessage?.autoForwarded || false;
            const forwardCount = latestMessage?.forwardCount || 0;
            
            return (
              <div
                key={u._id}
                onClick={() => onSelectChat(u)}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/50 group relative ${
                  isSelected ? 'bg-slate-100' : ''
                } ${isEscalated ? 'border-l-4 border-l-orange-500' : ''} ${
                  isRecentlyUpdated ? 'animate-pulse bg-blue-50' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      u.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`
                    }
                    alt={u.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  
                  {/* Escalation Badge */}
                  {isEscalated && (
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-1 shadow-lg">
                      <TrendingUp size={12} className="text-white" />
                    </div>
                  )}
                  
                  {/* Unread Count Badge */}
                  {unreadCount > 0 && !isEscalated && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-semibold px-1.5 shadow-lg animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p
                        className={`font-semibold truncate transition-colors duration-200 ${
                          unreadCount > 0 ? 'text-blue-600' : 'text-slate-900'
                        } ${isEscalated ? 'text-orange-600' : ''}`}
                      >
                        {u.name}
                      </p>
                      
                      {/* Escalation Indicator */}
                      {isEscalated && (
                        <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          <AlertTriangle size={10} />
                          <span>Escalated</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-400 flex-shrink-0">
                      {formatMessageTime(latestMessage?.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p
                      className={`text-xs truncate flex-1 ${
                        unreadCount > 0
                          ? 'text-slate-700 font-medium'
                          : 'text-slate-500'
                      } ${isEscalated ? 'text-orange-600 font-medium' : ''}`}
                    >
                      {isEscalated && '🔔 '}
                      {latestMessage?.text ||
                        (latestMessage?.media?.length ? '📎 Attachment' : 'No messages')}
                    </p>
                    
                    {/* Forward Count */}
                    {forwardCount > 0 && (
                      <span className="text-xs text-orange-500 font-medium ml-2 flex-shrink-0">
                        ×{forwardCount}
                      </span>
                    )}
                  </div>
                  
                  {/* Escalation Details */}
                  {isEscalated && latestMessage.issueId && (
                    <div className="mt-1 text-xs text-orange-500 flex items-center gap-1">
                      <AlertTriangle size={10} />
                      <span>Auto-escalated issue message</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default ChatList;