import { useState, useRef } from 'react';
import './MessageInput.css';

function MessageInput({ onSendMessage, onTyping, onStopTyping, disabled }) {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const handleChange = (e) => {
    setMessage(e.target.value);

    // Trigger typing indicator
    if (!isTypingRef.current && e.target.value.length > 0) {
      isTypingRef.current = true;
      onTyping();
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onStopTyping();
      }
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Stop typing indicator
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onStopTyping();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={disabled ? 'Waiting for connection...' : 'Type a message'}
        value={message}
        onChange={handleChange}
        disabled={disabled}
        autoFocus
      />
      <button 
        type="submit" 
        disabled={!message.trim() || disabled}
        className="send-button"
      >
        ➤
      </button>
    </form>
  );
}

export default MessageInput;
