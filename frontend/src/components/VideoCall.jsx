import { useEffect, useRef, useState } from 'react';
import './VideoCall.css';

// STUN servers for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

function VideoCall({ roomId, isVideo, remoteSocketId, onEndCall, emit, on, off, isCaller }) {
  
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteSocketIdRef = useRef(remoteSocketId);
  const isInitializedRef = useRef(false); // Track if call has been initialized

  useEffect(() => {
    remoteSocketIdRef.current = remoteSocketId;
  }, [remoteSocketId]);

  // Mount effect - runs once
  useEffect(() => {
    console.log('🎥 VideoCall component mounted');
    
    return () => {
      console.log('🧹 VideoCall unmounting - cleaning up');
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize call when remoteSocketId becomes available (ONLY ONCE)
  useEffect(() => {
    if (!remoteSocketId) {
      console.log('⚠️ remoteSocketId not set yet, waiting...');
      return;
    }
    
    if (isInitializedRef.current) {
      console.log('⏭️ Call already initialized, skipping...');
      return;
    }
    
    console.log('✅ remoteSocketId available:', remoteSocketId, '- initializing call');
    isInitializedRef.current = true;
    initializeCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteSocketId]); // Only initialize when remoteSocketId changes from null to a value

  /**
   * Initialize media stream and peer connection
   */
  const initializeCall = async () => {
    try {
      console.log('🚀 initializeCall() starting...');
      console.log('   roomId:', roomId);
      console.log('   isVideo:', isVideo);
      console.log('   remoteSocketId:', remoteSocketIdRef.current);
      console.log('   isCaller:', isCaller);
      
      // Get local media stream
      console.log('🎤 Requesting media access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });
      console.log('✅ Media access granted');

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      console.log('🔗 Creating peer connection...');
      createPeerConnection();
      console.log('✅ Peer connection created');

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });
      console.log('✅ Local tracks added to peer connection');

      console.log('📡 About to call setupWebRTCListeners()...');
      // Setup WebRTC event listeners
      setupWebRTCListeners();

      // Only caller creates offer
      if (isCaller) {
        console.log('👤 We are the CALLER - creating offer for:', remoteSocketIdRef.current);
        setTimeout(async () => {
          await createAndSendOffer();
        }, 1000); // Give receiver time to set up
      } else {
        console.log('👥 We are the RECEIVER - waiting for offer from:', remoteSocketIdRef.current);
      }

      console.log('✅ Call initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing call:', error);
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
   * Create and send WebRTC offer to remote peer
   */
  const createAndSendOffer = async () => {
    try {
      console.log('🎬 Creating offer for', remoteSocketIdRef.current);
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo
      });
      await peerConnectionRef.current.setLocalDescription(offer);
      
      console.log('📤 Sending offer to', remoteSocketIdRef.current);
      emit('webrtc-offer', {
        roomId,
        offer: offer,
        targetSocketId: remoteSocketIdRef.current
      });
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  };

  /**
   * Setup WebRTC signaling listeners
   */
  const setupWebRTCListeners = () => {
    console.log('📡 ========== SETTING UP WEBRTC LISTENERS ==========');
    console.log('   remoteSocketId:', remoteSocketIdRef.current);
    console.log('   roomId:', roomId);
    
    // Handle receiving offer - create answer
    const handleWebRTCOffer = async (data) => {
      console.log('📥 ========== RECEIVED WEBRTC OFFER ==========');
      console.log('   From:', data.fromSocketId);
      console.log('   Offer type:', data.offer?.type);
      console.log('   Current signaling state:', peerConnectionRef.current?.signalingState);
      remoteSocketIdRef.current = data.fromSocketId;

      try {
        // Ensure peer connection exists and is ready
        if (!peerConnectionRef.current) {
          console.error('❌ CRITICAL: Peer connection not initialized!');
          return;
        }

        console.log('⚙️ Calling setRemoteDescription with offer...');
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        console.log('✅ Offer applied successfully');

        console.log('🎬 Creating answer...');
        const answer = await peerConnectionRef.current.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideo
        });
        console.log('✅ Answer created');
        
        console.log('⚙️ Setting local description with answer...');
        await peerConnectionRef.current.setLocalDescription(answer);
        console.log('✅ Local description set');

        console.log('📤 ========== SENDING ANSWER ==========');
        console.log('   To:', data.fromSocketId);
        emit('webrtc-answer', {
          roomId,
          answer: answer,
          targetSocketId: data.fromSocketId
        });
        console.log('✅ Answer sent successfully');
      } catch (error) {
        console.error('❌ ========== ERROR HANDLING OFFER ==========');
        console.error('   Error:', error);
      }
    };

    // Handle receiving answer
    const handleWebRTCAnswer = async (data) => {
      console.log('📥 ========== RECEIVED WEBRTC ANSWER ==========');
      console.log('   From:', data.fromSocketId);
      console.log('   Answer type:', data.answer?.type);
      console.log('   Current signaling state:', peerConnectionRef.current?.signalingState);
      
      try {
        if (!peerConnectionRef.current) {
          console.error('❌ CRITICAL: Peer connection not initialized!');
          return;
        }

        console.log('⚙️ Calling setRemoteDescription with answer...');
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        console.log('✅ ========== ANSWER APPLIED SUCCESSFULLY ==========');
        console.log('   New signaling state:', peerConnectionRef.current.signalingState);
        console.log('   Connection state:', peerConnectionRef.current.connectionState);
        console.log('   ICE connection state:', peerConnectionRef.current.iceConnectionState);
      } catch (error) {
        console.error('❌ ========== ERROR APPLYING ANSWER ==========');
        console.error('   Error:', error);
        console.error('   Signaling state:', peerConnectionRef.current?.signalingState);
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

    on('webrtc-offer', handleWebRTCOffer);
    on('webrtc-answer', handleWebRTCAnswer);
    on('ice-candidate', handleIceCandidate);
    on('call-ended', handleCallEnded);

    console.log('✅ WebRTC listeners registered:', {
      'webrtc-offer': true,
      'webrtc-answer': true,
      'ice-candidate': true,
      'call-ended': true
    });

    // Cleanup listeners
    return () => {
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
