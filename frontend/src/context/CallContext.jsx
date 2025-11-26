// FILE: frontend/src/context/CallContext.jsx
/**
 * 🔥 FINAL FIX:
 * - Fixed notification permission error
 * - Request permission only on user interaction
 * - All other fixes preserved
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

  const [callIncoming, setCallIncoming] = useState(null);
  const [callOutgoing, setCallOutgoing] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [callStatus, setCallStatus] = useState("idle");
  const [callType, setCallType] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [recipientOnline, setRecipientOnline] = useState(null);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);
  const localStream = useRef(null);
  const ringtoneRef = useRef(null);
  const callTimerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const remoteUserRef = useRef(null);
  const preloadedStream = useRef(null);
  const remoteAudioRef = useRef(null);
  const notificationPermissionRequested = useRef(false);

  // ✅ Create audio element (no permission request here)
  useEffect(() => {
    if (!remoteAudioRef.current) {
      remoteAudioRef.current = document.createElement('audio');
      remoteAudioRef.current.autoplay = true;
      remoteAudioRef.current.playsInline = true;
      document.body.appendChild(remoteAudioRef.current);
      console.log('✅ Audio element created');
    }

    return () => {
      if (remoteAudioRef.current) {
        document.body.removeChild(remoteAudioRef.current);
        remoteAudioRef.current = null;
      }
    };
  }, []);

  // ✅ Timer syncs from backend timestamp
  useEffect(() => {
    if (callStatus === 'connected' && callStartTimeRef.current) {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }

      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(elapsed);
      };

      updateTimer();
      callTimerRef.current = setInterval(updateTimer, 1000);
      
      console.log('⏱️  Timer started from:', callStartTimeRef.current);
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
  }, [callStatus, callStartTimeRef.current]);

  // Ringtone
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
            console.warn('Ringtone error:', err);
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

  const formatDurationForHistory = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // ✅ Request notification permission ONLY on user interaction (when making/receiving call)
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'default' && !notificationPermissionRequested.current) {
      try {
        notificationPermissionRequested.current = true;
        const permission = await Notification.requestPermission();
        console.log('📱 Notification permission:', permission);
        return permission === 'granted';
      } catch (err) {
        console.warn('Notification permission error:', err);
        return false;
      }
    }

    return false;
  };

  // ✅ Show notification
  const showCallNotification = async (callerName, callType) => {
    const hasPermission = await requestNotificationPermission();
    
    if (hasPermission) {
      try {
        const notification = new Notification(`Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`, {
          body: `${callerName} is calling...`,
          icon: '/vite.svg',
          tag: 'incoming-call',
          requireInteraction: true,
          vibrate: [200, 100, 200],
          silent: false
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (err) {
        console.warn('Notification error:', err);
      }
    }
    return null;
  };

  const getMediaStream = async (type = "video") => {
    try {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }

      const constraints = {
        video: type === "video" ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
          volume: 1.0
        },
      };

      console.log('🎥 Getting media:', type);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      console.log('✅ Media obtained:', {
        audio: !!audioTrack,
        video: !!videoTrack,
        audioEnabled: audioTrack?.enabled
      });

      if (audioTrack) {
        audioTrack.enabled = true;
        console.log('🎤 Audio ENABLED');
      }

      localStream.current = stream;

      if (myVideo.current && stream) {
        myVideo.current.srcObject = stream;
        myVideo.current.muted = true;
        myVideo.current.volume = 0;
        
        try {
          await myVideo.current.play();
          console.log('✅ Local video playing');
        } catch (err) {
          console.warn('Local play warning:', err);
        }
      }

      return stream;
    } catch (err) {
      console.error("❌ Media error:", err);
      alert(`Cannot access microphone/camera: ${err.message}`);
      return null;
    }
  };

  const applySpeakerVolume = () => {
    const volume = isSpeakerOn ? 1.0 : 0.2;
    if (userVideo.current) {
      userVideo.current.volume = volume;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = volume;
    }
  };

  useEffect(() => {
    applySpeakerVolume();
  }, [isSpeakerOn]);

  // ✅ Attach remote stream
  const attachRemoteStream = async (remoteStream) => {
    console.log('🎉 Attaching remote stream');
    
    const audioTracks = remoteStream.getAudioTracks();
    const videoTracks = remoteStream.getVideoTracks();
    
    console.log('📊 Remote tracks:', {
      audio: audioTracks.length,
      video: videoTracks.length
    });

    // Force enable
    audioTracks.forEach(track => {
      track.enabled = true;
      console.log('🔊 Audio enabled:', track.id);
    });
    
    videoTracks.forEach(track => {
      track.enabled = true;
    });

    // Attach to video element
    if (userVideo.current) {
      userVideo.current.srcObject = remoteStream;
      userVideo.current.muted = false;
      userVideo.current.volume = 1.0;
      userVideo.current.autoplay = true;
      userVideo.current.playsInline = true;
      
      try {
        await userVideo.current.play();
        console.log('✅ Remote video playing');
      } catch (err) {
        console.error('Video play error:', err);
      }
    }

    // Attach to audio element
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      
      try {
        await remoteAudioRef.current.play();
        console.log('✅ Remote AUDIO playing');
      } catch (err) {
        console.error('Audio play error:', err);
      }
    }
  };

  const callUser = async (receiver, type = "video") => {
    try {
      const callerId = currentUser?.id || currentUser?._id;
      const receiverId = receiver?._id || receiver?.id;

      if (!currentUser || !callerId) {
        alert('Session expired. Please refresh.');
        return;
      }

      if (!receiver || !receiverId) {
        alert('Invalid recipient.');
        return;
      }

      if (!socket || !connected) {
        alert('Not connected to server.');
        return;
      }

      if (callStatus !== 'idle') {
        alert('Already in a call.');
        return;
      }

      console.log(`📞 Starting ${type} call to:`, receiver.name);

      // ✅ Request notification permission when user initiates call
      await requestNotificationPermission();

      remoteUserRef.current = receiver;
      setCallType(type);
      setCallStatus("calling");
      setCallOutgoing({ user: receiver, type });
      setRecipientOnline(null);

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
            { urls: "stun:global.stun.twilio.com:3478" }
          ],
        },
      });

      peer.on("signal", (signalData) => {
        console.log('📡 Sending call signal');
        socket.emit("call-user", {
          userToCall: receiverId,
          from: callerId,
          fromUser: {
            _id: callerId,
            name: currentUser.name || 'Unknown',
            avatar: currentUser.avatar,
          },
          signalData,
          type,
        });
      });

      peer.on("stream", async (remoteStream) => {
        console.log('🎉 CALLER: Got remote stream');
        stopRingtone();
        setCallAccepted(true);
        await attachRemoteStream(remoteStream);
      });

      peer.on("error", (err) => {
        console.error("❌ Peer error:", err);
        stopRingtone();
        alert('Connection error.');
        leaveCall();
      });

      peer.on("close", () => {
        leaveCall();
      });

      connectionRef.current = peer;

      callTimeoutRef.current = setTimeout(() => {
        if ((callStatus === "calling" || callStatus === "ringing") && !callAccepted) {
          alert('Call not answered');
          leaveCall();
        }
      }, 30000);

    } catch (err) {
      console.error("❌ Call error:", err);
      stopRingtone();
      setCallStatus('idle');
      setCallOutgoing(null);
    }
  };

  const answerCall = async () => {
    try {
      if (!callIncoming) return;

      console.log('📞 Answering call');

      remoteUserRef.current = callIncoming.userData;

      stopRingtone();
      setCallAccepted(true);
      setCallStatus("connecting");
      setCallType(callIncoming.type);

      let stream = preloadedStream.current;
      if (!stream) {
        stream = await getMediaStream(callIncoming.type);
      }
      
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
            { urls: "stun:global.stun.twilio.com:3478" }
          ],
        },
      });

      peer.on("signal", (signal) => {
        console.log('📡 Sending answer');
        socket.emit("answer-call", { 
          to: callIncoming.fromUser, 
          signal 
        });
      });

      peer.on("stream", async (remoteStream) => {
        console.log('🎉 ANSWERER: Got remote stream');
        await attachRemoteStream(remoteStream);
      });

      peer.on("error", (err) => {
        console.error("❌ Peer error:", err);
        alert('Connection error.');
        leaveCall();
      });

      peer.on("close", () => {
        leaveCall();
      });

      peer.signal(callIncoming.signalData);

      connectionRef.current = peer;
      setCallIncoming(null);
      preloadedStream.current = null;

    } catch (err) {
      console.error("❌ Answer error:", err);
      alert('Failed to answer call.');
      rejectCall();
    }
  };

  const rejectCall = () => {
    console.log('❌ Rejecting call');
    stopRingtone();
    
    if (socket && callIncoming) {
      socket.emit('reject-call', { to: callIncoming.fromUser });
    }

    if (preloadedStream.current) {
      preloadedStream.current.getTracks().forEach(track => track.stop());
      preloadedStream.current = null;
    }

    setCallIncoming(null);
    setCallStatus('idle');
    setRecipientOnline(null);
  };

  const leaveCall = async () => {
    console.log('📴 Leaving call');
    
    stopRingtone();
    
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (callStatus === 'connected' && remoteUserRef.current && sendMessage) {
      const duration = callDuration;
      const formattedDuration = formatDurationForHistory(duration);
      const callTypeIcon = callType === 'video' ? '📹' : '📞';
      const callMessage = `${callTypeIcon} ${callType === 'video' ? 'Video' : 'Voice'} call • ${formattedDuration}`;
      
      try {
        const receiverId = remoteUserRef.current._id || remoteUserRef.current.id;
        await sendMessage(receiverId, callMessage, []);
      } catch (err) {
        console.error('Failed to send call history:', err);
      }
    }

    if (socket && connected) {
      const targetUserId = callIncoming?.fromUser || callOutgoing?.user?._id || callOutgoing?.user?.id;
      if (targetUserId) {
        socket.emit("end-call", { to: targetUserId });
      }
    }

    if (connectionRef.current) {
      try {
        connectionRef.current.destroy();
      } catch (err) {
        console.warn('Peer destroy error:', err);
      }
      connectionRef.current = null;
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    if (myVideo.current) {
      myVideo.current.srcObject = null;
    }
    if (userVideo.current) {
      userVideo.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

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
      setRecipientOnline(null);
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
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
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

      console.log('📷 Switched camera');
    } catch (error) {
      console.error('Camera switch error:', error);
    }
  };

  useEffect(() => {
    if (!socket || !connected) return;

    const handleIncomingCall = async ({ from, fromUser, signalData, type }) => {
      console.log('📞 INCOMING CALL from:', fromUser?.name);
      
      if (callStatus !== 'idle') {
        socket.emit('user-busy', { to: from });
        return;
      }

      // ✅ Show notification (requests permission if needed)
      await showCallNotification(fromUser?.name || 'Someone', type);

      setCallIncoming({
        fromUser: from,
        userData: fromUser,
        signalData,
        type,
      });
      setCallStatus("ringing");
      playRingtone();

      try {
        const stream = await getMediaStream(type);
        preloadedStream.current = stream;
        console.log('✅ Stream pre-loaded');
      } catch (err) {
        console.error('Pre-load failed:', err);
      }
    };

    const handleCallReceived = () => {
      console.log('✅ Call received by recipient');
      setCallStatus("ringing");
      setRecipientOnline(true);
    };

    const handleCallConnected = ({ startTime }) => {
      console.log('✅ CALL CONNECTED! startTime:', startTime);
      
      if (startTime) {
        callStartTimeRef.current = startTime;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setCallDuration(elapsed);
        console.log(`⏱️  Timer synced: ${elapsed}s`);
      }
      
      setCallStatus("connected");
      console.log('🎉 Both users connected!');
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
      stopRingtone();
      alert('Call rejected');
      leaveCall();
    };

    const handleCallEnded = () => {
      leaveCall();
    };

    const handleUserBusy = () => {
      stopRingtone();
      alert('User is busy');
      leaveCall();
    };

    const handleUserOffline = () => {
      setRecipientOnline(false);
    };

    const handleCallError = ({ message }) => {
      stopRingtone();
      alert(message || 'Call failed');
      leaveCall();
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-received", handleCallReceived);
    socket.on("call-connected", handleCallConnected);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);
    socket.on("user-busy", handleUserBusy);
    socket.on("user-offline", handleUserOffline);
    socket.on("call-error", handleCallError);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-received", handleCallReceived);
      socket.off("call-connected", handleCallConnected);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-ended", handleCallEnded);
      socket.off("user-busy", handleUserBusy);
      socket.off("user-offline", handleUserOffline);
      socket.off("call-error", handleCallError);
    };
  }, [socket, connected, callStatus]);

  useEffect(() => {
    return () => {
      leaveCall();
      stopRingtone();
      if (preloadedStream.current) {
        preloadedStream.current.getTracks().forEach(track => track.stop());
      }
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
    recipientOnline,
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