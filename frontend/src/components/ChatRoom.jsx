import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VideoCall from './VideoCall';
import './ChatRoom.css';

function ChatRoom({ roomId, username, onLeaveRoom }) {
  const { emit, on, off } = useSocket();
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  // Call state
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callType, setCallType] = useState(null); // 'audio' or 'video'
  const [remoteSocketId, setRemoteSocketId] = useState(null);

  const typingTimeoutRef = useRef(null);

  // Join room on mount
  useEffect(() => {
    emit('join-room', { roomId, username });

    // Setup event listeners
    const handleRoomJoined = (data) => {
      console.log('Room joined:', data);
      setMessages(data.messages || []);
      setUsers(data.users || []);
      setConnected(true);
      setError(null);
    };

    const handleRoomFull = (data) => {
      setError(data.message);
      setTimeout(() => onLeaveRoom(), 2000);
    };

    const handleUsernameTaken = (data) => {
      setError(data.message);
      setTimeout(() => onLeaveRoom(), 2000);
    };

    const handleUserJoined = (data) => {
      setUsers(data.users || []);
    };

    const handleUserLeft = (data) => {
      setUsers(data.users || []);
      // Clear messages when user leaves (ephemeral chat)
      setMessages([]);
    };

    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleMessageSent = (message) => {
      setMessages(prev => [...prev, { ...message, isMine: true }]);
    };

    const handleUserTyping = (data) => {
      setTypingUser(data.username);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUser(null);
      }, 3000);
    };

    const handleUserStopTyping = () => {
      setTypingUser(null);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };

    const handleMessagesMarkedRead = (data) => {
      setMessages(prev => 
        prev.map(msg => 
          data.messageIds.includes(msg.id) 
            ? { ...msg, read: true }
            : msg
        )
      );
    };

    // Incoming call
    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      setRemoteSocketId(data.fromSocketId);
    };

    const handleCallRejected = () => {
      setInCall(false);
      setIncomingCall(null);
      setCallType(null);
      setRemoteSocketId(null);
    };

    const handleCallEnded = () => {
      setInCall(false);
      setIncomingCall(null);
      setCallType(null);
      setRemoteSocketId(null);
    };

    // Register all listeners
    on('room-joined', handleRoomJoined);
    on('room-full', handleRoomFull);
    on('username-taken', handleUsernameTaken);
    on('user-joined', handleUserJoined);
    on('user-left', handleUserLeft);
    on('new-message', handleNewMessage);
    on('message-sent', handleMessageSent);
    on('user-typing', handleUserTyping);
    on('user-stop-typing', handleUserStopTyping);
    on('messages-marked-read', handleMessagesMarkedRead);
    on('incoming-call', handleIncomingCall);
    on('call-rejected', handleCallRejected);
    on('call-ended', handleCallEnded);

    // Cleanup
    return () => {
      emit('leave-room');
      off('room-joined', handleRoomJoined);
      off('room-full', handleRoomFull);
      off('username-taken', handleUsernameTaken);
      off('user-joined', handleUserJoined);
      off('user-left', handleUserLeft);
      off('new-message', handleNewMessage);
      off('message-sent', handleMessageSent);
      off('user-typing', handleUserTyping);
      off('user-stop-typing', handleUserStopTyping);
      off('messages-marked-read', handleMessagesMarkedRead);
      off('incoming-call', handleIncomingCall);
      off('call-rejected', handleCallRejected);
      off('call-ended', handleCallEnded);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, username, emit, on, off, onLeaveRoom]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0) {
      const unreadMessageIds = messages
        .filter(msg => !msg.isMine && !msg.read)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        emit('messages-read', { roomId, messageIds: unreadMessageIds });
      }
    }
  }, [messages, roomId, emit]);

  const handleSendMessage = (text) => {
    emit('send-message', { roomId, text });
  };

  const handleTyping = () => {
    emit('typing', { roomId });
  };

  const handleStopTyping = () => {
    emit('stop-typing', { roomId });
  };

  const handleStartCall = (isVideo) => {
    const otherUser = users.find(u => u.username !== username);
    if (!otherUser) return;

    setCallType(isVideo ? 'video' : 'audio');
    setInCall(true);
    emit('call-user', { roomId, isVideo });
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    
    setCallType(incomingCall.isVideo ? 'video' : 'audio');
    setRemoteSocketId(incomingCall.fromSocketId); // Set remote socket ID!
    setInCall(true);
    emit('call-accepted', { 
      roomId, 
      fromSocketId: incomingCall.fromSocketId 
    });
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    
    emit('call-rejected', { 
      roomId, 
      fromSocketId: incomingCall.fromSocketId 
    });
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    emit('call-ended', { roomId });
    setInCall(false);
    setCallType(null);
    setRemoteSocketId(null);
  };

  const otherUser = users.find(u => u.username !== username);
  const isOtherUserOnline = otherUser && otherUser.online;

  return (
    <div className="chat-room">
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          <button className="back-button" onClick={onLeaveRoom}>
            ←
          </button>
          <div className="room-info">
            <h2>{otherUser ? otherUser.username : 'Waiting...'}</h2>
            <p className="status">
              {connected ? (
                isOtherUserOnline ? (
                  <span className="online">● Online</span>
                ) : (
                  <span className="offline">○ Waiting for user...</span>
                )
              ) : (
                'Connecting...'
              )}
            </p>
          </div>
        </div>

        <div className="header-actions">
          {isOtherUserOnline && !inCall && (
            <>
              <button 
                className="call-button"
                onClick={() => handleStartCall(false)}
                title="Audio call"
              >
                📞
              </button>
              <button 
                className="call-button"
                onClick={() => handleStartCall(true)}
                title="Video call"
              >
                📹
              </button>
            </>
          )}
        </div>
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="incoming-call-modal">
          <div className="modal-content">
            <h3>Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call</h3>
            <p>{incomingCall.from} is calling...</p>
            <div className="modal-actions">
              <button 
                className="accept-button"
                onClick={handleAcceptCall}
              >
                ✓ Accept
              </button>
              <button 
                className="reject-button"
                onClick={handleRejectCall}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Component */}
      {inCall && (
        <VideoCall
          roomId={roomId}
          isVideo={callType === 'video'}
          remoteSocketId={remoteSocketId}
          onEndCall={handleEndCall}
        />
      )}

      {/* Chat Interface */}
      {!inCall && (
        <>
          <MessageList 
            messages={messages}
            currentUsername={username}
            typingUser={typingUser}
          />
          
          <MessageInput 
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            disabled={false}
          />
        </>
      )}
    </div>
  );
}

export default ChatRoom;
