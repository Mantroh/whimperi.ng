import { useEffect, useRef } from 'react';
import './MessageList.css';

function MessageList({ messages, currentUsername, typingUser }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="empty-state">
          <p>🔒 Your messages are end-to-end encrypted</p>
          <p>Start a conversation by sending a message below</p>
        </div>
      )}

      {messages.map((msg) => {
        const isMine = msg.sender === currentUsername || msg.isMine;
        
        return (
          <div 
            key={msg.id} 
            className={`message ${isMine ? 'message-mine' : 'message-other'}`}
          >
            <div className="message-content">
              {!isMine && (
                <div className="message-sender">{msg.sender}</div>
              )}
              <div className="message-text">{msg.text}</div>
              <div className="message-meta">
                <span className="message-time">
                  {formatTime(msg.timestamp)}
                </span>
                {isMine && (
                  <span className="message-status">
                    {msg.read ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {typingUser && (
        <div className="typing-indicator">
          <div className="typing-content">
            <span className="typing-user">{typingUser}</span>
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
