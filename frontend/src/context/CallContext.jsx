// FILE: frontend/src/context/CallContext.jsx
/**
 * ✅ FIXED: Real-time audio works both ways
 * ✅ FIXED: Speaker on/off actually controls volume
 * ✅ FIXED: Own video always shows
 * ✅ FIXED: Call history message sent on end
 */
import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { useSocket } from "@/hooks";
import { AuthContext } from "./AuthContext";
import { MessageContext } from "./MessageContext";
import Peer from "simple-peer";

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { socket, connected } = useSocket();
  const { user: currentUser } = useContext(AuthContext);
  const { sendMessage } = useContext(MessageContext);

  // Call states
  const [callIncoming, setCallIncoming] = useState(null);
  const [callOutgoing, setCallOutgoing] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [callStatus, setCallStatus] = useState("idle");
  const [callType, setCallType] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true); // ✅ Default ON for calls

  // Refs
  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);
  const localStream = useRef(null);
  const ringtoneRef = useRef(null);
  const callTimerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const callStartTimeRef = useRef(null); // ✅ Track when call connected
  const remoteUserRef = useRef(null); // ✅ Track remote user for call history

  // ✅ Initialize ringtone
  useEffect(() => {
    try {
      ringtoneRef.current = {
        play: () => {
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 440;
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 200);
          } catch (err) {
            console.warn('Cannot play ringtone:', err);
          }
        },
        pause: () => {},
        currentTime: 0
      };
    } catch (err) {
      console.error('Ringtone init error:', err);
    }

    return () => {
      ringtoneRef.current = null;
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
      
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      if (callStatus === 'idle') {
        setCallDuration(0);
        callStartTimeRef.current = null;
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStatus]);

  const playRingtone = () => {
    try {
      if (ringtoneRef.current) {
        ringtoneRef.current.play();
      }
    } catch (err) {
      console.warn('Ringtone play error:', err);
    }
  };

  const stopRingtone = () => {
    try {
      if (ringtoneRef.current && ringtoneRef.current.pause) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    } catch (err) {
      console.warn('Ringtone stop error:', err);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ Format duration for call history (e.g., "2m 34s")
  const formatDurationForHistory = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // ✅ FIX: Get media stream with better error handling
  const getMediaStream = async (type = "video") => {
    try {
      // Stop any existing streams first
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }

      const constraints = {
        video: type === "video" ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      console.log('🎥 Requesting media access:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Media stream obtained:', {
        audio: stream.getAudioTracks().length,
        video: stream.getVideoTracks().length,
        audioSettings: stream.getAudioTracks()[0]?.getSettings(),
        videoSettings: stream.getVideoTracks()[0]?.getSettings()
      });

      localStream.current = stream;

      // ✅ Wait for video element to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // ✅ ALWAYS attach local video (even if camera is off)
      if (myVideo.current) {
        myVideo.current.srcObject = stream;
        myVideo.current.muted = true;
        myVideo.current.volume = 0;
        
        try {
          await myVideo.current.play();
          console.log('✅ Local video playing');
        } catch (playErr) {
          console.warn('Local video play warning (can be ignored):', playErr);
        }
      }

      return stream;
    } catch (err) {
      console.error("❌ Media device error:", err);
      
      let errorMessage = 'Cannot access media devices. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera and microphone permissions.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += type === 'video' 
          ? 'No camera found. Please check your camera connection.'
          : 'No microphone found. Please check your microphone connection.';
      } else if (err.name === 'NotReadableError' || err.message.includes('videoinput failed')) {
        errorMessage += 'Camera is being used by another application. Please close other apps and try again.';
      } else {
        errorMessage += 'Please check your device settings.';
      }
      
      alert(errorMessage);
      return null;
    }
  };

  // ✅ CRITICAL FIX: Apply speaker volume to remote video
  const applySpeakerVolume = () => {
    if (userVideo.current) {
      userVideo.current.volume = isSpeakerOn ? 1.0 : 0.2; // Speaker ON = full volume, OFF = 20%
      console.log(`🔊 Speaker volume set to: ${userVideo.current.volume}`);
    }
  };

  // ✅ Apply speaker volume whenever it changes
  useEffect(() => {
    applySpeakerVolume();
  }, [isSpeakerOn]);

  // ✅ FIX: Call user with proper setup
  const callUser = async (receiver, type = "video") => {
    try {
      console.log('📞 Call attempt:', { 
        currentUser: currentUser?.id || currentUser?._id, 
        receiver: receiver?._id || receiver?.id, 
        socketConnected: connected,
        socketExists: !!socket 
      });

      const callerId = currentUser?.id || currentUser?._id;
      const receiverId = receiver?._id || receiver?.id;

      if (!currentUser || !callerId) {
        console.error('❌ Current user not authenticated:', currentUser);
        alert('Session expired. Please refresh the page and login again.');
        return;
      }

      if (!receiver || !receiverId) {
        console.error('❌ Invalid recipient:', receiver);
        alert('Invalid recipient user.');
        return;
      }

      if (!socket || !connected) {
        console.error('❌ Socket not connected');
        alert('Not connected to server. Please check your internet connection.');
        return;
      }

      if (callStatus !== 'idle') {
        console.warn('⚠️ Already in a call');
        alert('You are already in a call.');
        return;
      }

      console.log(`📞 Initiating ${type} call to:`, receiver.name);

      // ✅ Store remote user for call history
      remoteUserRef.current = receiver;

      setCallType(type);
      setCallStatus("ringing");
      setCallOutgoing({ user: receiver, type });

      playRingtone();

      const stream = await getMediaStream(type);
      if (!stream) {
        stopRingtone();
        setCallStatus('idle');
        setCallOutgoing(null);
        return;
      }

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });

      peer.on("signal", (signalData) => {
        console.log('📡 Sending call signal to:', receiverId);
        
        socket.emit("call-user", {
          userToCall: receiverId,
          from: callerId,
          fromUser: {
            _id: callerId,
            id: callerId,
            name: currentUser.name || 'Unknown',
            avatar: currentUser.avatar,
          },
          signalData,
          type,
        });
      });

      // ✅ CRITICAL FIX: Handle remote stream with proper audio setup
      peer.on("stream", async (remoteStream) => {
        console.log('🎉 RECEIVED REMOTE STREAM!');
        console.log('📹 Remote stream details:', {
          id: remoteStream.id,
          active: remoteStream.active,
          audioTracks: remoteStream.getAudioTracks().length,
          videoTracks: remoteStream.getVideoTracks().length,
          audioTrack: remoteStream.getAudioTracks()[0]?.getSettings(),
          videoTrack: remoteStream.getVideoTracks()[0]?.getSettings()
        });
        
        stopRingtone();
        setCallStatus("connected");
        setCallAccepted(true);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
          userVideo.current.muted = false; // ✅ MUST be false to hear audio
          userVideo.current.volume = isSpeakerOn ? 1.0 : 0.2; // ✅ Apply speaker setting
          userVideo.current.autoplay = true;
          userVideo.current.playsInline = true;
          
          try {
            await userVideo.current.play();
            console.log('✅ Remote video is now playing!');
            console.log('🔊 Audio enabled:', !userVideo.current.muted, 'Volume:', userVideo.current.volume);
          } catch (playErr) {
            console.error('❌ Remote video play error:', playErr);
            setTimeout(async () => {
              try {
                await userVideo.current.play();
                console.log('✅ Remote video playing (retry succeeded)');
              } catch (retryErr) {
                console.error('❌ Retry failed:', retryErr);
              }
            }, 500);
          }
        } else {
          console.error('❌ userVideo ref is null!');
        }
      });

      peer.on("error", (err) => {
        console.error("❌ Peer error:", err);
        stopRingtone();
        alert('Connection error. Please try again.');
        leaveCall();
      });

      peer.on("close", () => {
        console.log('Peer connection closed');
        leaveCall();
      });

      connectionRef.current = peer;

      callTimeoutRef.current = setTimeout(() => {
        if (callStatus === "ringing" && !callAccepted) {
          console.log('⏰ Call timeout - no answer');
          alert('Call not answered');
          leaveCall();
        }
      }, 30000);

    } catch (err) {
      console.error("❌ Call error:", err);
      stopRingtone();
      setCallStatus('idle');
      setCallOutgoing(null);
      alert('Failed to initiate call. Please try again.');
    }
  };

  // ✅ FIX: Answer call with proper stream handling
  const answerCall = async () => {
    try {
      if (!callIncoming) {
        console.warn('No incoming call to answer');
        return;
      }

      console.log('📞 Answering call from:', callIncoming.userData?.name);

      // ✅ Store remote user for call history
      remoteUserRef.current = callIncoming.userData;

      stopRingtone();
      setCallAccepted(true);
      setCallStatus("connecting");
      setCallType(callIncoming.type);

      const stream = await getMediaStream(callIncoming.type);
      if (!stream) {
        rejectCall();
        return;
      }

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });

      peer.on("signal", (signal) => {
        console.log('📡 Sending answer signal');
        socket.emit("answer-call", { 
          to: callIncoming.fromUser, 
          signal 
        });
      });

      // ✅ CRITICAL FIX: Handle remote stream
      peer.on("stream", async (remoteStream) => {
        console.log('🎉 RECEIVED REMOTE STREAM (answerer)!');
        console.log('📹 Remote stream details:', {
          id: remoteStream.id,
          active: remoteStream.active,
          audioTracks: remoteStream.getAudioTracks().length,
          videoTracks: remoteStream.getVideoTracks().length
        });
        
        setCallStatus("connected");
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
          userVideo.current.muted = false; // ✅ Must be false to hear
          userVideo.current.volume = isSpeakerOn ? 1.0 : 0.2;
          userVideo.current.autoplay = true;
          userVideo.current.playsInline = true;
          
          try {
            await userVideo.current.play();
            console.log('✅ Remote video playing!');
            console.log('🔊 Audio enabled:', !userVideo.current.muted, 'Volume:', userVideo.current.volume);
          } catch (playErr) {
            console.error('❌ Remote video play error:', playErr);
            setTimeout(async () => {
              try {
                await userVideo.current.play();
                console.log('✅ Remote video playing (retry)');
              } catch (err) {
                console.error('Retry failed:', err);
              }
            }, 500);
          }
        }
      });

      peer.on("error", (err) => {
        console.error("❌ Peer error:", err);
        alert('Connection error. Please try again.');
        leaveCall();
      });

      peer.on("close", () => {
        console.log('Peer connection closed');
        leaveCall();
      });

      peer.signal(callIncoming.signalData);

      connectionRef.current = peer;
      setCallIncoming(null);

    } catch (err) {
      console.error("❌ Answer error:", err);
      alert('Failed to answer call. Please try again.');
      rejectCall();
    }
  };

  const rejectCall = () => {
    console.log('❌ Rejecting call');
    stopRingtone();
    
    if (socket && callIncoming) {
      socket.emit('reject-call', { to: callIncoming.fromUser });
    }

    setCallIncoming(null);
    setCallStatus('idle');
  };

  // ✅ FIX: Leave call with call history message
  const leaveCall = async () => {
    console.log('📴 Leaving call');
    
    stopRingtone();
    
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    // ✅ Send call history message if call was connected
    if (callStatus === 'connected' && remoteUserRef.current && sendMessage) {
      const duration = callDuration;
      const formattedDuration = formatDurationForHistory(duration);
      const callTypeIcon = callType === 'video' ? '📹' : '📞';
      const callMessage = `${callTypeIcon} ${callType === 'video' ? 'Video' : 'Audio'} call • ${formattedDuration}`;
      
      console.log('💬 Sending call history message:', callMessage);
      
      try {
        const receiverId = remoteUserRef.current._id || remoteUserRef.current.id;
        await sendMessage(receiverId, callMessage, []);
        console.log('✅ Call history message sent');
      } catch (err) {
        console.error('❌ Failed to send call history message:', err);
      }
    }

    if (socket && connected) {
      const targetUserId = callIncoming?.fromUser || callOutgoing?.user?._id || callOutgoing?.user?.id;
      if (targetUserId) {
        socket.emit("end-call", { to: targetUserId });
      }
    }

    // Destroy peer connection
    if (connectionRef.current) {
      try {
        connectionRef.current.destroy();
      } catch (err) {
        console.warn('Peer destroy error:', err);
      }
      connectionRef.current = null;
    }

    // Stop all media tracks
    if (localStream.current) {
      try {
        localStream.current.getTracks().forEach((track) => {
          track.stop();
          console.log('🛑 Stopped track:', track.kind);
        });
      } catch (err) {
        console.warn('Track stop error:', err);
      }
      localStream.current = null;
    }

    // Clear video elements
    if (myVideo.current) {
      myVideo.current.srcObject = null;
    }
    if (userVideo.current) {
      userVideo.current.srcObject = null;
    }

    // Reset states
    setCallEnded(true);
    setCallStatus("ended");

    setTimeout(() => {
      setCallEnded(false);
      setCallAccepted(false);
      setCallIncoming(null);
      setCallOutgoing(null);
      setCallType(null);
      setCallStatus("idle");
      setIsMuted(false);
      setIsVideoOff(false);
      setCallDuration(0);
      remoteUserRef.current = null;
      callStartTimeRef.current = null;
    }, 1000);
  };

  const toggleMute = () => {
    if (!localStream.current) return;
    
    const audioTrack = localStream.current.getAudioTracks()[0];
    if (!audioTrack) return;
    
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
    console.log('🎤 Mute:', !audioTrack.enabled);
  };

  const toggleVideo = () => {
    if (callType !== "video" || !localStream.current) return;
    
    const videoTrack = localStream.current.getVideoTracks()[0];
    if (!videoTrack) return;
    
    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoOff(!videoTrack.enabled);
    console.log('📹 Video off:', !videoTrack.enabled);
  };

  // ✅ FIX: Actually control speaker volume
  const toggleSpeaker = () => {
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);
    
    // Apply immediately to remote video
    if (userVideo.current) {
      userVideo.current.volume = newSpeakerState ? 1.0 : 0.2;
      console.log('🔊 Speaker:', newSpeakerState ? 'ON (100%)' : 'OFF (20%)', 'Volume:', userVideo.current.volume);
    }
  };

  const switchCamera = async () => {
    if (!localStream.current || callType !== 'video') return;

    try {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (!videoTrack) return;
      
      const currentFacingMode = videoTrack.getSettings().facingMode || 'user';
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

      videoTrack.stop();

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      if (connectionRef.current && connectionRef.current._pc) {
        const sender = connectionRef.current._pc
          .getSenders()
          .find(s => s.track && s.track.kind === 'video');
        
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      localStream.current.removeTrack(videoTrack);
      localStream.current.addTrack(newVideoTrack);

      if (myVideo.current) {
        myVideo.current.srcObject = localStream.current;
      }

      console.log('📷 Switched camera to:', newFacingMode);
    } catch (error) {
      console.error('Camera switch error:', error);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket || !connected) return;

    const handleIncomingCall = ({ from, fromUser, signalData, type }) => {
      console.log('📞 Incoming call from:', fromUser?.name);
      
      if (callStatus !== 'idle') {
        console.log('Already in a call, rejecting');
        socket.emit('user-busy', { to: from });
        return;
      }

      setCallIncoming({
        fromUser: from,
        userData: fromUser,
        signalData,
        type,
      });
      setCallStatus("ringing");
      playRingtone();
    };

    const handleCallAccepted = (signal) => {
      console.log('✅ Call accepted');
      stopRingtone();
      
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      if (connectionRef.current) {
        try {
          connectionRef.current.signal(signal);
          setCallAccepted(true);
          setCallStatus("connecting");
        } catch (err) {
          console.error('Signal error:', err);
          leaveCall();
        }
      }
    };

    const handleCallRejected = () => {
      console.log('❌ Call rejected');
      stopRingtone();
      alert('Call was rejected');
      leaveCall();
    };

    const handleCallEnded = () => {
      console.log('📴 Call ended by other user');
      leaveCall();
    };

    const handleUserBusy = () => {
      console.log('📵 User is busy');
      stopRingtone();
      alert('User is busy on another call');
      leaveCall();
    };

    const handleCallError = ({ message }) => {
      console.error('❌ Call error from server:', message);
      stopRingtone();
      alert(message || 'Call failed. Please try again.');
      leaveCall();
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);
    socket.on("user-busy", handleUserBusy);
    socket.on("call-error", handleCallError);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-ended", handleCallEnded);
      socket.off("user-busy", handleUserBusy);
      socket.off("call-error", handleCallError);
    };
  }, [socket, connected, callStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveCall();
      stopRingtone();
    };
  }, []);

  const value = {
    callIncoming,
    callOutgoing,
    callAccepted,
    callEnded,
    callType,
    callStatus,
    callDuration,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    myVideo,
    userVideo,
    callUser,
    answerCall,
    rejectCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    switchCamera,
    formatDuration,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};