import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/useAuth';

const VideoCall = ({ targetUserId, targetUserName, onClose, roomId: propRoomId = null, fromUserId: propFromUserId = null, autoJoin = false }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState(autoJoin ? 'ringing' : 'idle'); // idle, calling, ringing, connected, ended
  const [roomId, setRoomId] = useState(propRoomId);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!token || !targetUserId) return;

    // Use provided roomId or generate new one
    const newRoomId = propRoomId || `room_${user.id}_${targetUserId}_${Date.now()}`;
    setRoomId(newRoomId); // Always set roomId, even if propRoomId is provided

    // Initialize Socket.io
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('video:join', newRoomId);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // WebRTC event handlers
    newSocket.on('video:offer', async (data) => {
      if (data.fromUserId !== targetUserId) return;

      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        newSocket.emit('video:answer', {
          roomId: newRoomId,
          answer,
          targetUserId: data.fromUserId
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    newSocket.on('video:answer', async (data) => {
      if (data.fromUserId !== targetUserId) return;

      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    newSocket.on('video:ice-candidate', async (data) => {
      if (data.fromUserId !== targetUserId) return;

      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    newSocket.on('video:incoming-call', (data) => {
      if (data.fromUserId === targetUserId || (propFromUserId && data.fromUserId === propFromUserId)) {
        setCallStatus('ringing');
      }
    });

    // Auto-join if coming from email link
    if (autoJoin && propRoomId && propFromUserId) {
      // Auto-accept after a short delay
      setTimeout(() => {
        acceptCall();
      }, 1000);
    }

    newSocket.on('video:call-response', (data) => {
      if (data.fromUserId === targetUserId) {
        if (data.accepted) {
          setCallStatus('connected');
          startCall();
        } else {
          setCallStatus('ended');
          endCall();
        }
      }
    });

    newSocket.on('video:call-ended', (data) => {
      if (data.fromUserId === targetUserId) {
        setCallStatus('ended');
        endCall();
      }
    });

    // Initialize peer connection
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        newSocket.emit('video:ice-candidate', {
          roomId: newRoomId,
          candidate: event.candidate,
          targetUserId
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (newSocket) {
        newSocket.emit('video:leave', newRoomId);
        newSocket.disconnect();
      }
    };
  }, [token, targetUserId, user.id, propRoomId, propFromUserId, autoJoin]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const startCall = async () => {
    try {
      // Ensure we have roomId
      const currentRoomId = roomId || propRoomId || `room_${user.id}_${targetUserId}_${Date.now()}`;
      if (!roomId && currentRoomId) {
        setRoomId(currentRoomId);
      }

      // Wait for socket to be connected (max 5 seconds)
      if (!socketRef.current || !socketRef.current.connected) {
        let attempts = 0;
        await new Promise((resolve) => {
          const checkConnection = () => {
            attempts++;
            if (socketRef.current && socketRef.current.connected) {
              resolve();
            } else if (attempts > 50) {
              console.error('Socket connection timeout');
              alert('Không thể kết nối đến server. Vui lòng thử lại.');
              resolve();
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }

      // Send call request to server (this will trigger email notification)
      if (socketRef.current && socketRef.current.connected && currentRoomId) {
        socketRef.current.emit('video:call-request', {
          targetUserId,
          roomId: currentRoomId
        });
      } else {
        const errorMsg = `Cannot send call request: ${!socketRef.current ? 'no socket' : !socketRef.current.connected ? 'socket not connected' : !currentRoomId ? 'no roomId' : 'unknown error'}`;
        console.error(errorMsg);
        alert(errorMsg);
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socketRef.current.emit('video:offer', {
        roomId: currentRoomId,
        offer,
        targetUserId
      });

      setCallStatus('calling');
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Không thể truy cập camera/microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const acceptCall = async () => {
    setCallStatus('connected');
    await startCall();

    if (socketRef.current) {
      socketRef.current.emit('video:call-response', {
        targetUserId,
        roomId,
        accepted: true
      });
    }
  };

  const rejectCall = () => {
    setCallStatus('ended');
    if (socketRef.current) {
      socketRef.current.emit('video:call-response', {
        targetUserId,
        roomId,
        accepted: false
      });
    }
    endCall();
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      setRemoteStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = new RTCPeerConnection(configuration);
    }
    if (socketRef.current && roomId) {
      socketRef.current.emit('video:end-call', { roomId });
    }
    if (onClose) {
      onClose();
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  if (callStatus === 'ringing') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          minWidth: '300px'
        }}>
          <h2>📞 Cuộc gọi đến</h2>
          <p style={{ fontSize: '18px', margin: '20px 0' }}>{targetUserName}</p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
            <button
              onClick={acceptCall}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ✓
            </button>
            <button
              onClick={rejectCall}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (callStatus === 'ended') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#1f2937',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10000
    }}>
      {/* Remote video (main) */}
      <div style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#000'
      }}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        {!remoteStream && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '24px'
          }}>
            Đang kết nối với {targetUserName}...
          </div>
        )}
      </div>

      {/* Local video (small) */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '200px',
        height: '150px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid white',
        backgroundColor: '#000'
      }}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>

      {/* Controls */}
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        alignItems: 'center'
      }}>
        <button
          onClick={toggleAudio}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          🎤
        </button>
        <button
          onClick={toggleVideo}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          📹
        </button>
        <button
          onClick={endCall}
          style={{
            backgroundColor: '#ef4444',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '24px'
          }}
        >
          ✕
        </button>
        {callStatus === 'idle' && (
          <button
            onClick={startCall}
            style={{
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '24px'
            }}
          >
            📞
          </button>
        )}
      </div>

      {/* Status */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '10px 20px',
        borderRadius: '8px'
      }}>
        {callStatus === 'calling' && 'Đang gọi...'}
        {callStatus === 'connected' && `Đang nói chuyện với ${targetUserName}`}
        {!isConnected && 'Đang kết nối...'}
      </div>
    </div>
  );
};

export default VideoCall;
