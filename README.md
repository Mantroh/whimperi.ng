# WhatsApp-like Real-Time Chat Application

A production-ready, real-time chat web application with WebRTC audio/video calling, built with React, Socket.IO, and WebRTC.

## 🎯 Features

### Chat Features
- ✅ Real-time messaging with WebSockets (Socket.IO)
- ✅ One-to-one chat rooms (max 2 users per room)
- ✅ Typing indicator ("User is typing...")
- ✅ Message timestamps
- ✅ Blue tick read receipts (✓✓)
- ✅ Online/offline status indicators
- ✅ No message persistence (ephemeral chat)

### Calling Features
- ✅ Audio and video calling with WebRTC
- ✅ Incoming call prompt (Accept/Reject)
- ✅ Call states: connecting, connected, ended
- ✅ In-call controls: mute, video toggle, end call
- ✅ Proper signaling and cleanup

### Technical Features
- ✅ No database or persistence (in-memory only)
- ✅ No authentication (simple username)
- ✅ Room cleanup on disconnect
- ✅ Clean, modular, production-ready code
- ✅ WhatsApp-inspired UI

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐                  ┌─────────────────┐
│                 │   WebSocket      │                 │
│  React Client   ├──────────────────┤  Express + IO   │
│   (Frontend)    │   (Socket.IO)    │   (Backend)     │
│                 │                  │                 │
└────────┬────────┘                  └─────────────────┘
         │
         │ WebRTC (P2P)
         │ Direct Media
         │
┌────────▼────────┐
│                 │
│  React Client   │
│   (Frontend)    │
│                 │
└─────────────────┘
```

### Data Flow

**Chat Messages:**
1. User A types message → Socket.IO emit `send-message`
2. Server receives → Stores in-memory → Broadcasts to User B
3. User B receives → Displays message → Sends read receipt

**WebRTC Calling:**
1. User A clicks call → `call-user` event
2. Server forwards to User B → `incoming-call` event
3. User B accepts → `call-accepted` event
4. WebRTC offer/answer exchange via Socket.IO
5. ICE candidates exchanged for NAT traversal
6. Direct P2P media connection established

---

## 📁 Project Structure

```
whimpering-chat/
├── backend/
│   ├── server.js              # Main Express + Socket.IO server
│   ├── webrtc-signaling.js    # WebRTC signaling logic
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx         # Room join screen
│   │   │   ├── Login.css
│   │   │   ├── ChatRoom.jsx      # Main chat container
│   │   │   ├── ChatRoom.css
│   │   │   ├── MessageList.jsx   # Message display
│   │   │   ├── MessageList.css
│   │   │   ├── MessageInput.jsx  # Message input field
│   │   │   ├── MessageInput.css
│   │   │   ├── VideoCall.jsx     # WebRTC calling UI
│   │   │   └── VideoCall.css
│   │   ├── hooks/
│   │   │   └── useSocket.js      # Socket.IO custom hook
│   │   ├── App.jsx               # Root component
│   │   ├── App.css
│   │   ├── main.jsx              # React entry point
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json
└── README.md
```

---

## 🔌 WebSocket Events

### Chat Events

| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `join-room` | Client → Server | `{ roomId, username }` | Join a chat room |
| `room-joined` | Server → Client | `{ roomId, messages, users }` | Confirmation with room state |
| `room-full` | Server → Client | `{ message }` | Room has 2 users already |
| `username-taken` | Server → Client | `{ message }` | Username already in use |
| `user-joined` | Server → Client | `{ username, users }` | Another user joined |
| `user-left` | Server → Client | `{ username, users }` | User disconnected |
| `send-message` | Client → Server | `{ roomId, text }` | Send a message |
| `message-sent` | Server → Client | `{ id, sender, text, timestamp, read }` | Confirmation to sender |
| `new-message` | Server → Client | `{ id, sender, text, timestamp, read }` | New message from other user |
| `typing` | Client → Server | `{ roomId }` | User started typing |
| `user-typing` | Server → Client | `{ username }` | Other user is typing |
| `stop-typing` | Client → Server | `{ roomId }` | User stopped typing |
| `user-stop-typing` | Server → Client | `{ username }` | Other user stopped typing |
| `messages-read` | Client → Server | `{ roomId, messageIds }` | Mark messages as read |
| `messages-marked-read` | Server → Client | `{ messageIds }` | Read receipt confirmation |
| `leave-room` | Client → Server | - | Leave the room |

### WebRTC Signaling Events

| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `call-user` | Client → Server | `{ roomId, isVideo }` | Initiate a call |
| `incoming-call` | Server → Client | `{ from, fromSocketId, roomId, isVideo }` | Incoming call notification |
| `call-accepted` | Client → Server | `{ roomId, fromSocketId }` | Accept the call |
| `call-accepted` | Server → Client | `{ from, fromSocketId }` | Call was accepted |
| `call-rejected` | Client → Server | `{ roomId, fromSocketId }` | Reject the call |
| `call-rejected` | Server → Client | `{ from }` | Call was rejected |
| `call-ended` | Client → Server | `{ roomId }` | End the call |
| `call-ended` | Server → Client | `{ from }` | Call ended by other user |
| `webrtc-offer` | Client → Server | `{ roomId, offer, targetSocketId }` | WebRTC SDP offer |
| `webrtc-offer` | Server → Client | `{ offer, fromSocketId, from }` | Forward offer to peer |
| `webrtc-answer` | Client → Server | `{ roomId, answer, targetSocketId }` | WebRTC SDP answer |
| `webrtc-answer` | Server → Client | `{ answer, fromSocketId, from }` | Forward answer to peer |
| `ice-candidate` | Client → Server | `{ roomId, candidate, targetSocketId }` | ICE candidate for NAT traversal |
| `ice-candidate` | Server → Client | `{ candidate, fromSocketId }` | Forward ICE candidate |

---

## 🎥 WebRTC Signaling Flow

### Detailed Call Flow

```
Caller (User A)                Server                 Callee (User B)
     |                            |                          |
     |----call-user-------------->|                          |
     |                            |----incoming-call-------->|
     |                            |                          |
     |                            |<---call-accepted---------|
     |<---call-accepted-----------|                          |
     |                            |                          |
     |----webrtc-offer----------->|                          |
     |                            |----webrtc-offer--------->|
     |                            |                          |
     |                            |<---webrtc-answer---------|
     |<---webrtc-answer-----------|                          |
     |                            |                          |
     |----ice-candidate---------->|                          |
     |                            |----ice-candidate-------->|
     |                            |                          |
     |<===== Direct P2P Media Connection =====>|             |
     |                            |                          |
```

### WebRTC Connection Steps

1. **Call Initiation**
   - User A clicks call button
   - Client emits `call-user` with `isVideo` flag
   - Server forwards `incoming-call` to User B

2. **Call Acceptance**
   - User B clicks "Accept"
   - Client emits `call-accepted`
   - Server notifies User A

3. **Offer/Answer Exchange**
   - User A creates RTCPeerConnection
   - User A generates SDP offer → sends via `webrtc-offer`
   - User B receives offer → sets remote description
   - User B generates SDP answer → sends via `webrtc-answer`
   - User A receives answer → sets remote description

4. **ICE Candidate Exchange**
   - Both peers gather ICE candidates (STUN/TURN servers)
   - Candidates exchanged via `ice-candidate` events
   - NAT traversal established

5. **Media Stream**
   - Direct P2P connection established
   - Audio/video streams flow directly between peers
   - Server only handles signaling, not media

6. **Call Termination**
   - Either user clicks "End Call"
   - Emit `call-ended` event
   - Close RTCPeerConnection
   - Stop all media tracks

---

## 📦 In-Memory Data Structures

### Server-Side (backend/server.js)

```javascript
// Room storage
rooms = Map {
  [roomId]: {
    users: [
      { socketId: 'abc123', username: 'Alice' },
      { socketId: 'def456', username: 'Bob' }
    ],
    messages: [
      {
        id: '1234567890-abc',
        sender: 'Alice',
        text: 'Hello!',
        timestamp: '2026-01-02T12:00:00.000Z',
        read: false
      }
    ]
  }
}

// Socket to room mapping
socketToRoom = Map {
  'abc123': { roomId: 'room1', username: 'Alice' },
  'def456': { roomId: 'room1', username: 'Bob' }
}
```

**Important Notes:**
- All data is stored in-memory only
- No database or file storage
- Messages disappear on:
  - Server restart
  - User disconnect
  - Browser refresh

---

## 🚀 Setup and Installation

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Modern browser with WebRTC support

### Installation Steps

1. **Clone/Extract the project**
   ```bash
   cd whimperi.ng
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

   Or manually:
   ```bash
   # Install backend
   cd backend
   npm install

   # Install frontend
   cd ../frontend
   npm install
   ```

3. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on: `http://localhost:3000`

4. **Start the frontend (in a new terminal)**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

5. **Open the app**
   - Open two browser windows/tabs
   - Navigate to `http://localhost:5173` in both
   - Enter the same Room ID in both windows
   - Enter different usernames
   - Start chatting!

---

## 🎮 Usage Guide

### Creating/Joining a Room

1. Enter a **Room ID** (e.g., "room123")
2. Enter your **Username** (e.g., "Alice")
3. Click **Join Room**
4. Share the Room ID with a friend
5. Maximum 2 users per room

### Sending Messages

1. Wait for the other user to join (status shows "● Online")
2. Type in the message input at the bottom
3. Press Enter or click Send (➤)
4. Messages appear instantly
5. Blue ticks (✓✓) show when read

### Making Calls

1. Ensure other user is online
2. Click **📞** for audio call or **📹** for video call
3. Other user sees incoming call prompt
4. They can Accept ✓ or Reject ✗
5. Call connects with audio/video
6. Use controls to mute/unmute, toggle video, or end call

### Read Receipts

- Single tick (✓) = Message sent
- Double blue ticks (✓✓) = Message read by recipient

---

## 🛠️ Development

### Backend Development

```bash
cd backend
npm run dev  # Starts with nodemon (auto-restart)
```

### Frontend Development

```bash
cd frontend
npm run dev  # Starts Vite dev server with HMR
```

### Production Build

```bash
# Backend (no build needed, just run)
cd backend
npm start

# Frontend
cd frontend
npm run build    # Creates dist/ folder
npm run preview  # Preview production build
```

---

## 🔧 Configuration

### Backend Port

Edit `backend/server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Frontend API URL

Edit `frontend/src/hooks/useSocket.js`:
```javascript
const SERVER_URL = 'http://localhost:3000';
```

### STUN/TURN Servers

Edit `frontend/src/components/VideoCall.jsx`:
```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add TURN servers for production
  ]
};
```

---

## 🌐 Deployment Considerations

### Backend

- Deploy to Heroku, Railway, Render, or any Node.js host
- Ensure WebSocket support (Socket.IO)
- Set environment variables for PORT

### Frontend

- Build: `npm run build`
- Deploy `dist/` folder to Vercel, Netlify, or any static host
- Update `SERVER_URL` to production backend URL

### WebRTC

- **STUN servers** work for most cases (NAT traversal)
- For restrictive networks, add **TURN servers** (relay)
- Consider services like Twilio, Xirsys, or Metered

---

## 🔒 Security Notes

⚠️ **This is a demo application. For production:**

1. **Add authentication** (JWT, OAuth, etc.)
2. **Implement rate limiting** (prevent spam)
3. **Validate all inputs** (prevent XSS, injection)
4. **Use HTTPS/WSS** (secure WebSocket)
5. **Add TURN servers** (production WebRTC)
6. **Implement room passwords** (private rooms)
7. **Add user blocking/reporting**
8. **Sanitize messages** (prevent malicious content)

---

## 📝 Technical Decisions

### Why No Database?
- Simplifies architecture
- Demonstrates real-time capabilities
- Forces proper WebSocket/WebRTC implementation
- Easier to run and test locally

### Why Socket.IO?
- Auto-reconnection
- Fallback transports
- Room management
- Easy event-based API

### Why React + Vite?
- Fast development with HMR
- Modern build tool
- Great developer experience
- Component-based architecture

### Why WebRTC?
- Direct peer-to-peer media
- Low latency for calls
- Secure (encrypted by default)
- Browser native API

---

## 🐛 Troubleshooting

### "Room Full" Error
- Each room supports only 2 users
- Create a new room or wait for someone to leave

### "Username Taken" Error
- Choose a different username in the same room

### Messages Not Sending
- Check if other user is online (green dot)
- Ensure backend server is running
- Check browser console for errors

### Call Not Connecting
- Grant camera/microphone permissions
- Check browser compatibility (Chrome, Firefox, Safari)
- Verify STUN servers are reachable
- Check firewall/NAT settings

### WebSocket Connection Failed
- Ensure backend is running on port 3000
- Check CORS settings in `server.js`
- Verify `SERVER_URL` in frontend matches backend

---

## 🎨 UI/UX Features

- **Dark theme** inspired by WhatsApp
- **Responsive layout** (mobile-friendly)
- **Smooth animations** for messages and UI
- **Typing indicator** with animated dots
- **Online status** with colored badges
- **Read receipts** with blue ticks
- **Call controls** with intuitive icons
- **Picture-in-picture** local video during calls

---

## 📚 Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Socket.IO** - Real-time WebSocket library
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Socket.IO Client** - WebSocket client
- **WebRTC** - Peer-to-peer media
- **CSS3** - Styling and animations

---

## 🤝 Contributing

This is a demo project. Feel free to:
- Fork and extend
- Add features (group chat, file sharing, etc.)
- Improve UI/UX
- Add tests
- Fix bugs

---

## 📄 License

MIT License - Feel free to use for learning and personal projects.

---

## 👨‍💻 Author

Built as a demonstration of real-time web technologies:
- WebSockets (Socket.IO)
- WebRTC peer-to-peer media
- React modern patterns
- Production-ready architecture

---

## 🎓 Learning Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [React Hooks](https://react.dev/reference/react)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Enjoy building real-time applications! 🚀**
