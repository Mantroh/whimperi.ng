const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const setupWebRTCSignaling = require('./webrtc-signaling');

const app = express();
const server = http.createServer(app);

// Get port from environment or default
const PORT = process.env.PORT || 3000;

// Get frontend URL from environment or use production default
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// Configure CORS for Socket.IO - allow production domains
const io = socketIO(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, './dist')));

// ============================================
// IN-MEMORY DATA STRUCTURES
// ============================================
const rooms = new Map();
const socketToRoom = new Map();

// ============================================
// HELPER FUNCTIONS
// ============================================

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: [],
      messages: []
    });
  }
  return rooms.get(roomId);
}

function cleanupRoom(roomId) {
  const room = rooms.get(roomId);
  if (room && room.users.length === 0) {
    rooms.delete(roomId);
    console.log(`🗑️  Room ${roomId} cleaned up`);
  }
}

function getOtherUserSocket(roomId, currentSocketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  const otherUser = room.users.find(u => u.socketId !== currentSocketId);
  return otherUser ? otherUser.socketId : null;
}

// ============================================
// SOCKET.IO EVENT HANDLERS
// ============================================

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on('join-room', ({ roomId, username }) => {
    const room = getOrCreateRoom(roomId);

    if (room.users.length >= 2) {
      socket.emit('room-full', { message: 'This room already has 2 users' });
      return;
    }

    if (room.users.some(u => u.username === username)) {
      socket.emit('username-taken', { message: 'Username already taken in this room' });
      return;
    }

    room.users.push({ socketId: socket.id, username });
    socketToRoom.set(socket.id, { roomId, username });
    socket.join(roomId);

    console.log(`👤 ${username} joined room ${roomId}`);

    socket.emit('room-joined', {
      roomId,
      messages: room.messages,
      users: room.users.map(u => ({ username: u.username, online: true }))
    });

    socket.to(roomId).emit('user-joined', {
      username,
      users: room.users.map(u => ({ username: u.username, online: true }))
    });
  });

  socket.on('send-message', ({ roomId, text }) => {
    const userInfo = socketToRoom.get(socket.id);
    if (!userInfo || userInfo.roomId !== roomId) {
      return;
    }

    const room = rooms.get(roomId);
    if (!room) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: userInfo.username,
      text,
      timestamp: new Date().toISOString(),
      read: false
    };

    room.messages.push(message);

    socket.emit('message-sent', message);
    socket.to(roomId).emit('new-message', message);

    console.log(`💬 ${userInfo.username} sent message in ${roomId}`);
  });

  socket.on('typing', ({ roomId }) => {
    const userInfo = socketToRoom.get(socket.id);
    if (!userInfo) return;

    socket.to(roomId).emit('user-typing', { username: userInfo.username });
  });

  socket.on('stop-typing', ({ roomId }) => {
    const userInfo = socketToRoom.get(socket.id);
    if (!userInfo) return;

    socket.to(roomId).emit('user-stop-typing', { username: userInfo.username });
  });

  socket.on('messages-read', ({ roomId, messageIds }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.messages.forEach(msg => {
      if (messageIds.includes(msg.id)) {
        msg.read = true;
      }
    });

    socket.to(roomId).emit('messages-marked-read', { messageIds });
  });

  socket.on('leave-room', () => {
    handleUserDisconnect(socket);
  });

  socket.on('disconnect', () => {
    handleUserDisconnect(socket);
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

function handleUserDisconnect(socket) {
  const userInfo = socketToRoom.get(socket.id);
  if (!userInfo) return;

  const { roomId, username } = userInfo;
  const room = rooms.get(roomId);

  if (room) {
    room.users = room.users.filter(u => u.socketId !== socket.id);

    socket.to(roomId).emit('user-left', {
      username,
      users: room.users.map(u => ({ username: u.username, online: true }))
    });

    room.messages = [];
    cleanupRoom(roomId);
  }

  socketToRoom.delete(socket.id);
  socket.leave(roomId);
}

// Setup WebRTC signaling
setupWebRTCSignaling(io, socketToRoom, rooms);

// ============================================
// HTTP ENDPOINTS
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', (req, res) => {
  res.json({
    activeRooms: rooms.size,
    activeConnections: socketToRoom.size
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './dist/index.html'));
});

// ============================================
// START SERVER
// ============================================

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 Chat Server Running              ║
║   📡 Port: ${PORT}                       ║
║   🌍 Environment: PRODUCTION          ║
╚═══════════════════════════════════════╝
  `);
});
