import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import './VideoCall.css';

// STUN servers for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

function VideoCall({ roomId, isVideo, remoteSocketId, onEndCall }) {
  const { emit, on, off } = useSocket();
  
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteSocketIdRef = useRef(remoteSocketId);

  useEffect(() => {
    remoteSocketIdRef.current = remoteSocketId;
  }, [remoteSocketId]);

  useEffect(() => {
    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  /**
   * Initialize media stream and peer connection
   */
  const initializeCall = async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      createPeerConnection();

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Setup WebRTC event listeners
      setupWebRTCListeners();

      console.log('✅ Call initialized');
    } catch (error) {
      console.error('Error initializing call:', error);
      alert('Could not access camera/microphone');
      onEndCall();
    }
  };

  /**
   * Create RTCPeerConnection
   */
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && remoteSocketIdRef.current) {
        console.log('📤 Sending ICE candidate');
        emit('ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetSocketId: remoteSocketIdRef.current
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('📥 Received remote track:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus('connected');
      }
    };

    // Handle connection state changes - this is more reliable than ontrack
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅ Peer connection established');
        setCallStatus('connected');
      } else if (pc.connectionState === 'failed') {
        console.error('❌ Peer connection failed');
        setTimeout(() => onEndCall(), 1000);
      } else if (pc.connectionState === 'disconnected') {
        console.warn('⚠️ Peer connection disconnected');
        setTimeout(() => onEndCall(), 2000);
      }
    };

    // Handle ICE connection state as well
    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE state:', pc.iceConnectionState);
    };

    return pc;
  };

  /**
   * Setup WebRTC signaling listeners
   */
  const setupWebRTCListeners = () => {
    // Handle call accepted - create offer
    const handleCallAccepted = async (data) => {
      console.log('✅ Call accepted by', data.from);
      remoteSocketIdRef.current = data.fromSocketId;
      
      // Wait a moment for peer connection to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create and send offer
      try {
        console.log('🎬 Creating offer...');
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        
        console.log('📤 Sending offer to', data.fromSocketId);
        emit('webrtc-offer', {
          roomId,
          offer,
          targetSocketId: data.fromSocketId
        });
      } catch (error) {
        console.error('❌ Error creating offer:', error);
      }
    };

    // Handle receiving offer - create answer
    const handleWebRTCOffer = async (data) => {
      console.log('📥 Received WebRTC offer from', data.fromSocketId);
      remoteSocketIdRef.current = data.fromSocketId;

      try {
        console.log('⚙️ Setting remote description (offer)...');
        const rtcSessionDesc = new RTCSessionDescription(data.offer);
        await peerConnectionRef.current.setRemoteDescription(rtcSessionDesc);

        console.log('🎬 Creating answer...');
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        console.log('📤 Sending answer to', data.fromSocketId);
        emit('webrtc-answer', {
          roomId,
          answer,
          targetSocketId: data.fromSocketId
        });
      } catch (error) {
        console.error('❌ Error handling offer:', error);
      }
    };

    // Handle receiving answer
    const handleWebRTCAnswer = async (data) => {
      console.log('📥 Received WebRTC answer from', data.fromSocketId);
      
      try {
        console.log('⚙️ Setting remote description (answer)...');
        const rtcSessionDesc = new RTCSessionDescription(data.answer);
        await peerConnectionRef.current.setRemoteDescription(rtcSessionDesc);
        console.log('✅ Answer set successfully');
      } catch (error) {
        console.error('❌ Error handling answer:', error);
      }
    };

    // Handle ICE candidate
    const handleIceCandidate = async (data) => {
      try {
        if (data.candidate) {
          console.log('🧊 Adding ICE candidate from', data.fromSocketId);
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    };

    // Handle call ended
    const handleCallEnded = () => {
      console.log('📴 Call ended by remote user');
      onEndCall();
    };

    on('call-accepted', handleCallAccepted);
    on('webrtc-offer', handleWebRTCOffer);
    on('webrtc-answer', handleWebRTCAnswer);
    on('ice-candidate', handleIceCandidate);
    on('call-ended', handleCallEnded);

    // Cleanup listeners
    return () => {
      off('call-accepted', handleCallAccepted);
      off('webrtc-offer', handleWebRTCOffer);
      off('webrtc-answer', handleWebRTCAnswer);
      off('ice-candidate', handleIceCandidate);
      off('call-ended', handleCallEnded);
    };
  };

  /**
   * Toggle microphone
   */
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  /**
   * Toggle video
   */
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  /**
   * Cleanup resources
   */
  const cleanup = () => {
    console.log('🧹 Cleaning up call resources');

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  /**
   * End call
   */
  const handleEndCallClick = () => {
    emit('call-ended', { roomId });
    onEndCall();
  };

  return (
    <div className="video-call">
      <div className="video-container">
        {/* Remote video (full screen) */}
        <video
          ref={remoteVideoRef}
          className="remote-video"
          autoPlay
          playsInline
        />

        {/* Local video (picture-in-picture) */}
        {isVideo && (
          <video
            ref={localVideoRef}
            className="local-video"
            autoPlay
            playsInline
            muted
          />
        )}

        {/* Call status overlay */}
        {callStatus === 'connecting' && (
          <div className="call-status-overlay">
            <div className="status-content">
              <div className="spinner"></div>
              <p>Connecting...</p>
            </div>
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="call-controls">
        <button
          className={`control-button ${isMuted ? 'active' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        {isVideo && (
          <button
            className={`control-button ${isVideoOff ? 'active' : ''}`}
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn on video' : 'Turn off video'}
          >
            {isVideoOff ? '📹' : '📷'}
          </button>
        )}

        <button
          className="control-button end-call"
          onClick={handleEndCallClick}
          title="End call"
        >
          📞
        </button>
      </div>
    </div>
  );
}

export default VideoCall;
