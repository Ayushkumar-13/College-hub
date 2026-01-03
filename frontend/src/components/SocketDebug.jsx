/* 
 * FILE: frontend/src/components/SocketDebug.jsx
 * PURPOSE: Real-time socket event monitor
 * Add to App.jsx temporarily to debug socket events
 */
import React, { useEffect, useState } from 'react';
import { useSocket } from '@/hooks';
import { Activity, X, Zap, Users, AlertCircle } from 'lucide-react';

const SocketDebug = () => {
  const { socket, connected, onlineUsers } = useSocket();
  const [events, setEvents] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const eventTypes = [
      'post:like:update',
      'post:comment:update',
      'comment:like:update',
      'post:share:update',
      'post:create',
      'post:delete',
      'post:edit:update'
    ];

    const handlers = [];

    eventTypes.forEach(eventType => {
      const handler = (data) => {
        console.log(`🎯 Socket Debug captured: ${eventType}`, data);
        setEvents(prev => [
          { 
            time: new Date().toLocaleTimeString(), 
            event: eventType, 
            data: JSON.stringify(data).substring(0, 150)
          },
          ...prev.slice(0, 19) // Keep last 20 events
        ]);
      };

      socket.on(eventType, handler);
      handlers.push({ eventType, handler });
    });

    return () => {
      handlers.forEach(({ eventType, handler }) => {
        socket.off(eventType, handler);
      });
    };
  }, [socket]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center gap-2 font-semibold animate-pulse"
      >
        <Activity size={20} />
        <span>Socket Monitor</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <div>
            <div className="font-bold flex items-center gap-2">
              <Zap size={18} />
              <span>Socket Monitor</span>
            </div>
            <div className="text-xs opacity-90">
              {connected ? 'Connected & Listening' : 'Disconnected'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:bg-white/20 p-2 rounded-lg transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Status Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-slate-600 font-medium">Connection</span>
          <span className={`font-bold ${connected ? 'text-green-600' : 'text-red-600'}`}>
            {connected ? '✅ Active' : '❌ Inactive'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-600 font-medium">Socket ID</span>
          <span className="text-slate-700 font-mono text-xs">
            {socket?.id?.substring(0, 10) || 'N/A'}...
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-600 font-medium">Transport</span>
          <span className="text-slate-700 font-semibold uppercase">
            {socket?.io?.engine?.transport?.name || 'N/A'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-slate-600 font-medium flex items-center gap-1">
            <Users size={14} />
            Online
          </span>
          <span className="text-blue-600 font-bold">{onlineUsers?.size || 0}</span>
        </div>
      </div>

      {/* Events Log */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-slate-700">
            Recent Events ({events.length})
          </div>
          {events.length > 0 && (
            <button
              onClick={() => setEvents([])}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>
        
        {!connected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-700">
                <p className="font-semibold mb-1">Socket Disconnected</p>
                <p>Waiting for connection... Check your network.</p>
              </div>
            </div>
          </div>
        )}
        
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Activity size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-400 text-sm font-medium">No events captured</p>
            <p className="text-slate-300 text-xs mt-1">
              Try liking or commenting
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 rounded-xl p-3 border border-slate-200 hover:border-blue-300 transition animate-fadeIn"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-blue-600 text-xs uppercase">
                    {event.event.replace('post:', '').replace('comment:', 'c.')}
                  </span>
                  <span className="text-slate-400 text-xs">{event.time}</span>
                </div>
                <div className="text-slate-600 font-mono text-xs break-all bg-white p-2 rounded border border-slate-100">
                  {event.data}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Button */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <button
          onClick={() => {
            if (socket && connected) {
              console.log('🧪 Sending test event');
              socket.emit('test', { message: 'Test from debug panel' });
              setEvents(prev => [
                { 
                  time: new Date().toLocaleTimeString(), 
                  event: 'test:sent', 
                  data: '{"message":"Test from debug panel"}'
                },
                ...prev
              ]);
            }
          }}
          disabled={!connected}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {connected ? 'Send Test Event' : 'Waiting for Connection...'}
        </button>
      </div>
    </div>
  );
};

export default SocketDebug;