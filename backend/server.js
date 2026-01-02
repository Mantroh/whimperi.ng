const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const setupWebRTCSignaling = require('./webrtc-signaling');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// ============================================
// IN-MEMORY DATA STRUCTURES
// ============================================
// No database, no persistence. Data vanishes on restart.

const rooms = new Map(); // roomId -> { users: [], messages: [] }
const socketToRoom = new Map(); // socketId -> { roomId, username }

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get room data or create if doesn't exist
 */
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: [], // Array of { socketId, username }
      messages: [] // Array of { id, sender, text, timestamp, read }
    });
  }
  return rooms.get(roomId);
}

/**
 * Clean up empty rooms
 */
function cleanupRoom(roomId) {
  const room = rooms.get(roomId);
  if (room && room.users.length === 0) {
    rooms.delete(roomId);
    console.log(`🗑️  Room ${roomId} cleaned up`);
  }
}

/**
 * Get the other user in the room (for 1-on-1 chat)
 */
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

  /**
   * JOIN ROOM
   * - Maximum 2 users per room
   * - Send room state to the new user
   * - Notify existing user about new user joining
   */
  socket.on('join-room', ({ roomId, username }) => {
    const room = getOrCreateRoom(roomId);

    // Check if room is full (max 2 users)
    if (room.users.length >= 2) {
      socket.emit('room-full', { message: 'This room already has 2 users' });
      return;
    }

    // Check if username already exists in the room
    if (room.users.some(u => u.username === username)) {
      socket.emit('username-taken', { message: 'Username already taken in this room' });
      return;
    }

    // Add user to room
    room.users.push({ socketId: socket.id, username });
    socketToRoom.set(socket.id, { roomId, username });
    socket.join(roomId);

    console.log(`👤 ${username} joined room ${roomId}`);

    // Send current room state to the new user
    socket.emit('room-joined', {
      roomId,
      messages: room.messages,
      users: room.users.map(u => ({ username: u.username, online: true }))
    });

    // Notify other users in the room
    socket.to(roomId).emit('user-joined', {
      username,
      users: room.users.map(u => ({ username: u.username, online: true }))
    });
  });

  /**
   * SEND MESSAGE
   * - Store message in-memory
   * - Broadcast to other user in room
   */
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
      read: false // Read receipt status
    };

    room.messages.push(message);

    // Send to sender (for confirmation)
    socket.emit('message-sent', message);

    // Broadcast to other user
    socket.to(roomId).emit('new-message', message);

    console.log(`💬 ${userInfo.username} sent message in ${roomId}`);
  });

  /**
   * TYPING INDICATOR
   */
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

  /**
   * MESSAGE READ RECEIPT
   * - Mark all messages as read when user views them
   */
  socket.on('messages-read', ({ roomId, messageIds }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Mark messages as read
    room.messages.forEach(msg => {
      if (messageIds.includes(msg.id)) {
        msg.read = true;
      }
    });

    // Notify the sender about read receipt
    socket.to(roomId).emit('messages-marked-read', { messageIds });
  });

  /**
   * LEAVE ROOM
   */
  socket.on('leave-room', () => {
    handleUserDisconnect(socket);
  });

  /**
   * DISCONNECT
   * - Remove user from room
   * - Notify other user
   * - Clean up empty rooms
   */
  socket.on('disconnect', () => {
    handleUserDisconnect(socket);
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

/**
 * Handle user disconnect (from leave-room or disconnect)
 */
function handleUserDisconnect(socket) {
  const userInfo = socketToRoom.get(socket.id);
  if (!userInfo) return;

  const { roomId, username } = userInfo;
  const room = rooms.get(roomId);

  if (room) {
    // Remove user from room
    room.users = room.users.filter(u => u.socketId !== socket.id);

    // Notify other users
    socket.to(roomId).emit('user-left', {
      username,
      users: room.users.map(u => ({ username: u.username, online: true }))
    });

    // Clear messages when a user leaves (optional - keeps chat ephemeral)
    room.messages = [];

    // Clean up empty rooms
    cleanupRoom(roomId);
  }

  socketToRoom.delete(socket.id);
  socket.leave(roomId);
}

// ============================================
// WEBRTC SIGNALING
// ============================================
// Setup WebRTC signaling for audio/video calls
setupWebRTCSignaling(io, socketToRoom, rooms);

// ============================================
// HTTP ENDPOINTS (for debugging/health check)
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp-like Chat Server',
    activeRooms: rooms.size,
    activeConnections: socketToRoom.size
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🚀 Chat Server Running              ║
║   📡 Port: ${PORT}                       ║
║   🔗 http://localhost:${PORT}            ║
╚═══════════════════════════════════════╝
  `);
});
