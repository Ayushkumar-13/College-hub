// FILE: frontend/src/components/Call/GlobalCallOverlay.jsx
/**
 * ✅ ALL FIXES + NEW FEATURE:
 * - Shows "Calling..." when recipient is offline/not received
 * - Shows "Ringing..." when recipient received the call
 * - Touch events don't cut call
 * - Speaker on/off works
 * - Own video always shows
 * - Proper drag handling
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  Mic,
  MicOff,
  VideoOff as VideoOffIcon,
  Volume2,
  VolumeX,
  Camera,
  Minimize2,
  Maximize2,
  X,
} from "lucide-react";
import { useCall } from "@/context/CallContext";

const GlobalCallOverlay = () => {
  const {
    callIncoming,
    callOutgoing,
    callAccepted,
    callType,
    callStatus,
    recipientOnline, // ✅ NEW: Check if recipient received call
    myVideo,
    userVideo,
    answerCall,
    rejectCall,
    leaveCall,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    switchCamera,
    callDuration,
    formatDuration,
  } = useCall();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 360, y: 80 });
  const dragRef = useRef({ startX: 0, startY: 0, hasMoved: false });

  // Auto-hide controls
  useEffect(() => {
    if (!isMinimized && callAccepted && callStatus === "connected" && showControls) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isMinimized, callAccepted, callStatus, showControls]);

  if (
    !callIncoming &&
    !callOutgoing &&
    !callAccepted &&
    callStatus === "idle"
  ) {
    return null;
  }

  const handleMouseMove = () => {
    if (!isMinimized) setShowControls(true);
  };

  const getCallUser = () => {
    if (callIncoming) return callIncoming.userData || {};
    if (callOutgoing) return callOutgoing.user || {};
    return {};
  };

  const user = getCallUser();
  const name = user.name || "Unknown User";
  const avatar = user.avatar;

  const handleDragStart = (e) => {
    if (e.target.closest('button') || e.target.closest('video')) {
      return;
    }

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
      hasMoved: false
    };

    const handleDragMove = (moveEvent) => {
      dragRef.current.hasMoved = true;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 320, moveEvent.clientX - dragRef.current.startX)),
        y: Math.max(0, Math.min(window.innerHeight - 300, moveEvent.clientY - dragRef.current.startY))
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      setTimeout(() => {
        dragRef.current.hasMoved = false;
      }, 100);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('video')) {
      return;
    }

    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX - position.x,
      startY: touch.clientY - position.y,
      hasMoved: false
    };

    const handleTouchMove = (moveEvent) => {
      moveEvent.preventDefault();
      dragRef.current.hasMoved = true;
      const moveTouch = moveEvent.touches[0];
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 320, moveTouch.clientX - dragRef.current.startX)),
        y: Math.max(0, Math.min(window.innerHeight - 300, moveTouch.clientY - dragRef.current.startY))
      });
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      setTimeout(() => {
        dragRef.current.hasMoved = false;
      }, 100);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  // ==================== INCOMING CALL ====================
  if (callIncoming && callStatus === "ringing" && !callAccepted) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-96 max-w-[90vw] rounded-3xl p-8 text-white shadow-2xl animate-scaleIn">
          
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4">
              {avatar ? (   
                <img 
                  src={avatar} 
                  alt={name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-3xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
              <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" style={{ animationDelay: '0.5s' }} />
            </div>

            <h2 className="text-2xl font-bold mb-2 text-center">{name}</h2>
            <p className="text-blue-100 text-sm flex items-center gap-2">
              {callIncoming.type === "video" ? (
                <>
                  <Video size={16} />
                  Incoming Video Call...
                </>
              ) : (
                <>
                  <Phone size={16} />
                  Incoming Voice Call...
                </>
              )}
            </p>
          </div>

          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={(e) => {
                e.stopPropagation();
                rejectCall();
              }}
              className="group relative w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transform transition-all hover:scale-110 active:scale-95"
              title="Decline"
            >
              <PhoneOff size={28} />
              <span className="absolute -bottom-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Decline
              </span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                answerCall();
              }}
              className="group relative w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transform transition-all hover:scale-110 active:scale-95 animate-bounce"
              title="Answer"
            >
              <Phone size={28} />
              <span className="absolute -bottom-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Answer
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== OUTGOING CALL ====================
  if (callOutgoing && (callStatus === "calling" || callStatus === "ringing") && !callAccepted) {
    // ✅ NEW: Show different text based on recipient status
    const getCallStatusText = () => {
      if (callStatus === "calling" && recipientOnline === null) {
        return "Calling..."; // Haven't received confirmation yet
      }
      if (callStatus === "calling" && recipientOnline === false) {
        return "Calling..."; // Recipient is offline
      }
      if (callStatus === "ringing" || recipientOnline === true) {
        return "Ringing..."; // Recipient received the call
      }
      if (callStatus === "connecting") {
        return "Connecting...";
      }
      return "Calling...";
    };

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 w-96 max-w-[90vw] rounded-3xl p-8 text-white shadow-2xl">
          
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-3xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* ✅ Show animated rings only when ringing */}
              {(callStatus === "ringing" || recipientOnline === true) && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                </>
              )}
            </div>

            <h2 className="text-2xl font-bold mb-2 text-center">{name}</h2>
            <p className="text-indigo-100 text-sm animate-pulse">
              {getCallStatusText()}
            </p>
          </div>

          {/* ✅ Show loading dots only when calling */}
          {(callStatus === "calling" && recipientOnline !== true) && (
            <div className="flex justify-center gap-2 mb-8">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          )}

          {/* ✅ Show pulsing ring icon when ringing */}
          {(callStatus === "ringing" || recipientOnline === true) && (
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <Phone size={32} className="animate-bounce" />
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                leaveCall();
              }}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transform transition-all hover:scale-110 active:scale-95"
              title="End Call"
            >
              <PhoneOff size={28} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== ACTIVE CALL ====================
  if (callAccepted && (callStatus === "connected" || callStatus === "connecting")) {
    
    if (isMinimized) {
      return (
        <div 
          className="fixed z-[9999] bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-80 max-w-[90vw] overflow-hidden border border-slate-700 select-none"
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px`,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleTouchStart}
        >
          <div className="bg-slate-700/50 backdrop-blur-md px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-3 pointer-events-none">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">
                {formatDuration(callDuration)}
              </span>
            </div>
            <div className="flex gap-1 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(false);
                }}
                className="p-1.5 hover:bg-white/10 rounded transition-colors text-white"
                title="Maximize"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  leaveCall();
                }}
                className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-white"
                title="End Call"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="relative h-48 bg-slate-800 pointer-events-none">
            {callType === "video" ? (
              <>
                <video
                  ref={userVideo}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 w-20 h-28 rounded-lg overflow-hidden border border-white/20 bg-slate-700">
                  <video
                    ref={myVideo}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {isVideoOff && (
                    <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
                      <VideoOffIcon size={16} className="text-white/70" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-2xl font-bold mx-auto mb-2">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-slate-300">{name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-700/50 backdrop-blur-md px-4 py-3 flex items-center justify-center gap-4 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className={`p-2 rounded-full ${isMuted ? "bg-red-500" : "bg-white/20"}`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={16} className="text-white" /> : <Mic size={16} className="text-white" />}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSpeaker();
              }}
              className={`p-2 rounded-full ${isSpeakerOn ? "bg-blue-500" : "bg-white/20"}`}
              title={isSpeakerOn ? "Speaker On" : "Speaker Off"}
            >
              {isSpeakerOn ? <Volume2 size={16} className="text-white" /> : <VolumeX size={16} className="text-white" />}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                leaveCall();
              }}
              className="p-2 bg-red-500 rounded-full"
              title="End Call"
            >
              <PhoneOff size={16} className="text-white" />
            </button>
            
            {callType === "video" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVideo();
                }}
                className={`p-2 rounded-full ${isVideoOff ? "bg-red-500" : "bg-white/20"}`}
                title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
              >
                {isVideoOff ? <VideoOffIcon size={16} className="text-white" /> : <Video size={16} className="text-white" />}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col"
        onMouseMove={handleMouseMove}
        onTouchStart={() => setShowControls(true)}
      >
        <div
          className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-6 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-sm font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold">{name}</h3>
                <p className="text-xs text-gray-300">{formatDuration(callDuration)}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Minimize"
            >
              <Minimize2 size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
          {callType === "video" ? (
            <>
              <video
                ref={userVideo}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-black"
              />
              
              <div className="absolute top-20 right-6 w-32 h-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-800">
                <video
                  ref={myVideo}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <VideoOffIcon size={32} className="text-white/70" />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 mx-auto">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-5xl font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-2">{name}</h3>
                <p className="text-indigo-100">{formatDuration(callDuration)}</p>
              </div>
            </div>
          )}
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-8 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className={`p-4 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
                isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30 backdrop-blur-md"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {callType === "video" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVideo();
                }}
                className={`p-4 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
                  isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30 backdrop-blur-md"
                }`}
                title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
              >
                {isVideoOff ? <VideoOffIcon size={24} /> : <Video size={24} />}
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                leaveCall();
              }}
              className="p-5 bg-red-500 hover:bg-red-600 rounded-full shadow-lg transform transition-all hover:scale-110 active:scale-95"
              title="End Call"
            >
              <PhoneOff size={28} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSpeaker();
              }}
              className={`p-4 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
                isSpeakerOn ? "bg-blue-500 hover:bg-blue-600" : "bg-white/20 hover:bg-white/30 backdrop-blur-md"
              }`}
              title={isSpeakerOn ? "Speaker On" : "Speaker Off"}
            >
              {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>

            {callType === "video" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  switchCamera();
                }}
                className="p-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all transform hover:scale-110 active:scale-95"
                title="Switch Camera"
              >
                <Camera size={24} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GlobalCallOverlay;