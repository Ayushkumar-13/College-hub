// FILE: frontend/src/components/Call/GlobalCallOverlay.jsx
/**
 * ✅ ULTIMATE FIXES:
 * 1. Removed extra button during ringing (only shows End Call)
 * 2. "Calling..." vs "Ringing..." detection
 * 3. Instant call answer
 * 4. Touch events don't cut call
 * 5. Own video always shows with mirror effect
 */
import React, { useState, useEffect, useRef } from "react";
import { getInitials, hasUserAvatar } from "@/utils/avatarHelpers";
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
    recipientOnline,
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fadeIn">
        <div className="flex aspect-square w-full max-w-[340px] flex-col items-center justify-between rounded-[2rem] bg-gradient-to-br from-[#6344F5] via-[#7346F3] to-[#8B2CF5] p-8 text-white shadow-2xl animate-scaleIn">
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-5">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/15 p-1">
              {hasUserAvatar(avatar) ? (
                <img
                  src={avatar}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white/20 text-3xl font-bold">
                  {getInitials(name).charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 animate-ping rounded-full border-4 border-white/25" />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold">{name}</h2>
              <p className="mt-1.5 flex items-center justify-center gap-2 text-sm text-white/80">
                {callIncoming.type === "video" ? (
                  <>
                    <Video size={16} aria-hidden />
                    Incoming video call…
                  </>
                ) : (
                  <>
                    <Phone size={16} aria-hidden />
                    Incoming voice call…
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-6">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                rejectCall();
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF3B30] shadow-lg transition-transform hover:scale-110 active:scale-95"
              title="Decline"
              aria-label="Decline call"
            >
              <PhoneOff size={28} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                answerCall();
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg transition-transform hover:scale-110 active:scale-95"
              title="Answer"
              aria-label="Answer call"
            >
              <Phone size={28} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== OUTGOING CALL ====================
  if (callOutgoing && (callStatus === "calling" || callStatus === "ringing") && !callAccepted) {
    const getCallStatusText = () => {
      if (callStatus === "ringing" || recipientOnline === true) return "Ringing…";
      if (callStatus === "connecting") return "Connecting…";
      return "Calling…";
    };

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fadeIn">
        <div className="flex aspect-square w-full max-w-[340px] flex-col items-center justify-between rounded-[2rem] bg-gradient-to-br from-[#6344F5] via-[#7346F3] to-[#8B2CF5] p-8 text-white shadow-2xl">
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-5">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/15 p-1">
              {hasUserAvatar(avatar) ? (
                <img
                  src={avatar}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white/20 text-3xl font-bold">
                  {getInitials(name).charAt(0)}
                </div>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold">{name}</h2>
              <p className="mt-1.5 text-sm text-white/80">{getCallStatusText()}</p>
            </div>

            <div className="flex items-center justify-center gap-2" aria-hidden>
              <span
                className="h-2.5 w-2.5 animate-bounce rounded-full bg-white"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="h-2.5 w-2.5 animate-bounce rounded-full bg-white"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="h-2.5 w-2.5 animate-bounce rounded-full bg-white"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              leaveCall();
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF3B30] shadow-lg transition-transform hover:scale-110 active:scale-95"
            title="End call"
            aria-label="End call"
          >
            <PhoneOff size={28} />
          </button>
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
                className="p-1.5 hover:bg-white/10 rounded  text-white"
                title="Maximize"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  leaveCall();
                }}
                className="p-1.5 hover:bg-red-500/20 rounded  text-white"
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
                    {getInitials(name).charAt(0)}
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
              className="p-2 hover:bg-white/10 rounded-full "
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
                  {hasUserAvatar(avatar) ? (
                    <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-5xl font-bold">
                      {getInitials(name).charAt(0)}
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
