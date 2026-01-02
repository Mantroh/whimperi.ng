import { useState } from 'react';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import './App.css';

function App() {
  const [roomId, setRoomId] = useState(null);
  const [username, setUsername] = useState(null);

  const handleJoinRoom = (room, user) => {
    setRoomId(room);
    setUsername(user);
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setUsername(null);
  };

  return (
    <div className="app">
      {!roomId ? (
        <Login onJoinRoom={handleJoinRoom} />
      ) : (
        <ChatRoom 
          roomId={roomId} 
          username={username} 
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;
