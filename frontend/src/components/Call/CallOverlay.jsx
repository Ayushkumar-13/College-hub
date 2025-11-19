// FILE: frontend/src/components/Call/CallOverlay.jsx
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useCall } from "@/context/CallContext";

const CallOverlay = () => {
  const {
    callIncoming,
    callOutgoing,
    callAccepted,
    callEnded,
    callType,
    callStatus,
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

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (callAccepted && callStatus === "connected" && showControls) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [callAccepted, callStatus, showControls]);

  const handleMouseMove = () => setShowControls(true);

  // ==================== INCOMING CALL ====================
  if (callIncoming && callStatus === "ringing" && !callAccepted) {
    const user = callIncoming.userData || {};
    const name = user.name || "Unknown User";
    const avatar = user.avatar;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-96 rounded-3xl p-8 text-white shadow-2xl animate-scaleIn">
          
          {/* User Avatar */}
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
              
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
              <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" style={{ animationDelay: '0.5s' }} />
            </div>

            <h2 className="text-2xl font-bold mb-2">{name}</h2>
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

          {/* Action Buttons */}
          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={rejectCall}
              className="group relative w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transform transition-all hover:scale-110 active:scale-95"
              title="Decline"
            >
              <PhoneOff size={28} />
              <span className="absolute -bottom-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Decline
              </span>
            </button>

            <button
              onClick={answerCall}
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

  // ==================== OUTGOING CALL (Ringing) ====================
  if (callOutgoing && callStatus === "ringing" && !callAccepted) {
    const user = callOutgoing.user || {};
    const name = user.name || "Unknown User";
    const avatar = user.avatar;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 w-96 rounded-3xl p-8 text-white shadow-2xl">
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4">
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
            </div>

            <h2 className="text-2xl font-bold mb-2">{name}</h2>
            <p className="text-indigo-100 text-sm animate-pulse">
              {callStatus === "ringing" && "Ringing..."}
              {callStatus === "connecting" && "Connecting..."}
            </p>
          </div>

          {/* Loading dots */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>

          {/* End Call */}
          <div className="flex justify-center">
            <button
              onClick={leaveCall}
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
  if (callAccepted && callStatus === "connected") {
    const user = callOutgoing?.user || callIncoming?.userData || {};
    const name = user.name || "Unknown User";
    const avatar = user.avatar;

    // FULL SCREEN VIEW
    if (!isMinimized) {
      return (
        <div
          className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col"
          onMouseMove={handleMouseMove}
        >
          {/* Top Bar */}
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
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Minimize"
              >
                <Minimize2 size={20} />
              </button>
            </div>
          </div>

          {/* Video Container */}
          <div className="flex-1 relative">
            {callType === "video" ? (
              <video
                ref={userVideo}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-black"
              />
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

            {/* Local Video (PiP) */}
            {callType === "video" && (
              <div className="absolute top-20 right-6 w-32 h-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                <video
                  ref={myVideo}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <VideoOffIcon size={32} className="text-white/70" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-8 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center justify-center gap-6">
              {/* Mute */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                  isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30 backdrop-blur-md"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              {/* Video Toggle */}
              {callType === "video" && (
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                    isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30 backdrop-blur-md"
                  }`}
                  title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
                >
                  {isVideoOff ? <VideoOffIcon size={24} /> : <Video size={24} />}
                </button>
              )}

              {/* End Call */}
              <button
                onClick={leaveCall}
                className="p-5 bg-red-500 hover:bg-red-600 rounded-full shadow-lg transform transition-all hover:scale-110 active:scale-95"
                title="End Call"
              >
                <PhoneOff size={28} />
              </button>

              {/* Speaker */}
              <button
                onClick={toggleSpeaker}
                className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                  isSpeakerOn ? "bg-blue-500 hover:bg-blue-600" : "bg-white/20 hover:bg-white/30 backdrop-blur-md"
                }`}
                title={isSpeakerOn ? "Speaker On" : "Speaker Off"}
              >
                {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
              </button>

              {/* Switch Camera */}
              {callType === "video" && (
                <button
                  onClick={switchCamera}
                  className="p-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all transform hover:scale-110"
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

    // MINIMIZED VIEW
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-80 overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="bg-slate-700/50 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">
              {formatDuration(callDuration)}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors text-white"
            title="Maximize"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Video Preview */}
        <div className="relative h-48 bg-slate-800">
          {callType === "video" ? (
            <>
              <video
                ref={userVideo}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 w-20 h-28 rounded-lg overflow-hidden border border-white/20">
                <video
                  ref={myVideo}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
                    <VideoOffIcon size={20} className="text-white/70" />
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

        {/* Mini Controls */}
        <div className="bg-slate-700/50 backdrop-blur-md px-4 py-3 flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full ${isMuted ? "bg-red-500" : "bg-white/20"}`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff size={16} className="text-white" /> : <Mic size={16} className="text-white" />}
          </button>
          
          <button
            onClick={leaveCall}
            className="p-2 bg-red-500 rounded-full"
            title="End Call"
          >
            <PhoneOff size={16} className="text-white" />
          </button>
          
          {callType === "video" && (
            <button
              onClick={toggleVideo}
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

  return null;
};

export default CallOverlay;