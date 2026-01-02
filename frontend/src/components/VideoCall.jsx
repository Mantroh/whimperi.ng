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

    console.log('🔧 Creating peer connection with ICE servers:', ICE_SERVERS);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && remoteSocketIdRef.current) {
        console.log('📤 Sending ICE candidate');
        emit('ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetSocketId: remoteSocketIdRef.current
        });
      } else if (!event.candidate) {
        console.log('✅ All ICE candidates sent');
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('📥 Received remote track:', event.track.kind);
      if (remoteVideoRef.current && event.streams && event.streams[0]) {
        console.log('🎬 Setting remote video stream');
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus('connected');
      }
    };

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state:', pc.signalingState);
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅✅✅ PEER CONNECTION ESTABLISHED ✅✅✅');
        setCallStatus('connected');
      } else if (pc.connectionState === 'failed') {
        console.error('❌ Peer connection FAILED');
        setTimeout(() => onEndCall(), 1000);
      } else if (pc.connectionState === 'disconnected') {
        console.warn('⚠️ Peer connection disconnected');
        setTimeout(() => onEndCall(), 2000);
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.error('❌ ICE connection failed - checking for NAT issues');
      }
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
      
      // Add a small delay to ensure receiver has peer connection ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create and send offer
      try {
        console.log('🎬 Creating offer...');
        const offer = await peerConnectionRef.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideo
        });
        await peerConnectionRef.current.setLocalDescription(offer);
        
        console.log('📤 Sending offer to', data.fromSocketId);
        emit('webrtc-offer', {
          roomId,
          offer: offer,
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
        // Ensure peer connection exists and is ready
        if (!peerConnectionRef.current) {
          console.error('❌ Peer connection not initialized');
          return;
        }

        console.log('⚙️ Setting remote description (offer)...');
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        console.log('🎬 Creating answer...');
        const answer = await peerConnectionRef.current.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideo
        });
        
        await peerConnectionRef.current.setLocalDescription(answer);

        console.log('📤 Sending answer to', data.fromSocketId);
        emit('webrtc-answer', {
          roomId,
          answer: answer,
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
        if (!peerConnectionRef.current) {
          console.error('❌ Peer connection not initialized');
          return;
        }

        console.log('⚙️ Setting remote description (answer)...');
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        console.log('✅ Answer set successfully - waiting for ICE candidates');
      } catch (error) {
        console.error('❌ Error handling answer:', error);
      }
    };

    // Handle ICE candidate - buffer candidates if remote description not set yet
    const handleIceCandidate = async (data) => {
      try {
        if (!peerConnectionRef.current) {
          console.error('❌ Peer connection not initialized');
          return;
        }

        if (data.candidate) {
          console.log('🧊 Adding ICE candidate from', data.fromSocketId);
          try {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } catch (error) {
            // Ignore errors for candidates that can't be added yet
            // (remote description might not be set)
            console.log('⚠️ Could not add ICE candidate yet (normal):', error.message);
          }
        }
      } catch (error) {
        console.error('❌ Error in ICE handler:', error);
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
