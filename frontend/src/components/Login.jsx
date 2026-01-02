import { useState } from 'react';
import './Login.css';

function Login({ onJoinRoom }) {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!roomId.trim()) {
      setError('Please enter a Room ID');
      return;
    }

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    onJoinRoom(roomId.trim(), username.trim());
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="logo">💬</div>
          <h1>WhatsApp-like Chat</h1>
          <p>Real-time messaging with WebRTC calling</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="roomId">Room ID</label>
            <input
              id="roomId"
              type="text"
              placeholder="Enter or create a room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="join-button">
            Join Room
          </button>
        </form>

        <div className="info-text">
          <p>💡 Share the same Room ID with a friend to chat</p>
          <p>📱 Maximum 2 users per room</p>
          <p>🔄 Messages vanish on page refresh</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
