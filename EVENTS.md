# WebSocket Events Reference

Complete reference for all Socket.IO events used in the application.

## 📋 Event Categories

1. **Connection Events** - Basic connection lifecycle
2. **Room Management** - Joining/leaving rooms
3. **Chat Events** - Messaging and read receipts
4. **Typing Events** - Typing indicators
5. **Call Signaling** - WebRTC call setup
6. **WebRTC Signaling** - Offer/answer/ICE exchange

---

## 1. Connection Events

### `connect`
- **Direction**: Server → Client (automatic)
- **When**: Socket.IO connection established
- **Data**: None
- **Handler**: Logs connection in console

### `disconnect`
- **Direction**: Server → Client (automatic)
- **When**: Connection lost or closed
- **Data**: None
- **Handler**: Logs disconnection, triggers cleanup

---

## 2. Room Management Events

### `join-room`
- **Direction**: Client → Server
- **When**: User wants to join a chat room
- **Data**:
  ```javascript
  {
    roomId: string,    // Unique room identifier
    username: string   // User's display name
  }
  ```
- **Response**: `room-joined`, `room-full`, or `username-taken`

### `room-joined`
- **Direction**: Server → Client
- **When**: Successfully joined a room
- **Data**:
  ```javascript
  {
    roomId: string,
    messages: Array<Message>,  // Existing messages
    users: Array<{
      username: string,
      online: boolean
    }>
  }
  ```

### `room-full`
- **Direction**: Server → Client
- **When**: Room already has 2 users
- **Data**:
  ```javascript
  {
    message: string  // Error message
  }
  ```

### `username-taken`
- **Direction**: Server → Client
- **When**: Username already exists in room
- **Data**:
  ```javascript
  {
    message: string  // Error message
  }
  ```

### `user-joined`
- **Direction**: Server → Client (broadcast)
- **When**: Another user joins the room
- **Data**:
  ```javascript
  {
    username: string,
    users: Array<{
      username: string,
      online: boolean
    }>
  }
  ```

### `user-left`
- **Direction**: Server → Client (broadcast)
- **When**: User disconnects or leaves
- **Data**:
  ```javascript
  {
    username: string,
    users: Array<{
      username: string,
      online: boolean
    }>
  }
  ```

### `leave-room`
- **Direction**: Client → Server
- **When**: User voluntarily leaves room
- **Data**: None

---

## 3. Chat Events

### `send-message`
- **Direction**: Client → Server
- **When**: User sends a message
- **Data**:
  ```javascript
  {
    roomId: string,
    text: string  // Message content
  }
  ```
- **Response**: `message-sent` (to sender) and `new-message` (to recipient)

### `message-sent`
- **Direction**: Server → Client (sender only)
- **When**: Confirmation that message was sent
- **Data**:
  ```javascript
  {
    id: string,           // Unique message ID
    sender: string,       // Username
    text: string,         // Message content
    timestamp: string,    // ISO 8601 timestamp
    read: boolean         // Always false initially
  }
  ```

### `new-message`
- **Direction**: Server → Client (recipient only)
- **When**: Received a message from other user
- **Data**:
  ```javascript
  {
    id: string,
    sender: string,
    text: string,
    timestamp: string,
    read: boolean
  }
  ```

### `messages-read`
- **Direction**: Client → Server
- **When**: User viewed messages (read receipt)
- **Data**:
  ```javascript
  {
    roomId: string,
    messageIds: string[]  // Array of message IDs
  }
  ```

### `messages-marked-read`
- **Direction**: Server → Client
- **When**: Messages marked as read by recipient
- **Data**:
  ```javascript
  {
    messageIds: string[]  // Messages that are now read
  }
  ```

---

## 4. Typing Events

### `typing`
- **Direction**: Client → Server
- **When**: User starts typing
- **Data**:
  ```javascript
  {
    roomId: string
  }
  ```

### `user-typing`
- **Direction**: Server → Client (other user only)
- **When**: Other user started typing
- **Data**:
  ```javascript
  {
    username: string
  }
  ```
- **Note**: Frontend auto-clears after 3 seconds

### `stop-typing`
- **Direction**: Client → Server
- **When**: User stops typing
- **Data**:
  ```javascript
  {
    roomId: string
  }
  ```

### `user-stop-typing`
- **Direction**: Server → Client (other user only)
- **When**: Other user stopped typing
- **Data**:
  ```javascript
  {
    username: string
  }
  ```

---

## 5. Call Signaling Events

### `call-user`
- **Direction**: Client → Server
- **When**: User initiates a call
- **Data**:
  ```javascript
  {
    roomId: string,
    isVideo: boolean  // true = video call, false = audio only
  }
  ```

### `incoming-call`
- **Direction**: Server → Client (callee only)
- **When**: Receiving a call request
- **Data**:
  ```javascript
  {
    from: string,           // Caller's username
    fromSocketId: string,   // Caller's socket ID
    roomId: string,
    isVideo: boolean
  }
  ```

### `call-accepted`
- **Direction**: Client → Server
- **When**: User accepts incoming call
- **Data**:
  ```javascript
  {
    roomId: string,
    fromSocketId: string  // Original caller's socket ID
  }
  ```

### `call-accepted` (response)
- **Direction**: Server → Client (caller only)
- **When**: Call was accepted by other user
- **Data**:
  ```javascript
  {
    from: string,           // Accepter's username
    fromSocketId: string    // Accepter's socket ID
  }
  ```

### `call-rejected`
- **Direction**: Client → Server
- **When**: User rejects incoming call
- **Data**:
  ```javascript
  {
    roomId: string,
    fromSocketId: string
  }
  ```

### `call-rejected` (response)
- **Direction**: Server → Client (caller only)
- **When**: Call was rejected
- **Data**:
  ```javascript
  {
    from: string  // Rejecter's username
  }
  ```

### `call-ended`
- **Direction**: Client → Server
- **When**: User ends an active call
- **Data**:
  ```javascript
  {
    roomId: string
  }
  ```

### `call-ended` (broadcast)
- **Direction**: Server → Client (other user)
- **When**: Call ended by other user
- **Data**:
  ```javascript
  {
    from: string  // Who ended the call
  }
  ```

### `call-error`
- **Direction**: Server → Client
- **When**: Call cannot be initiated (room not ready, etc.)
- **Data**:
  ```javascript
  {
    message: string  // Error description
  }
  ```

---

## 6. WebRTC Signaling Events

### `webrtc-offer`
- **Direction**: Client → Server
- **When**: Caller creates WebRTC offer
- **Data**:
  ```javascript
  {
    roomId: string,
    offer: RTCSessionDescriptionInit,  // SDP offer
    targetSocketId: string              // Callee's socket ID
  }
  ```

### `webrtc-offer` (forward)
- **Direction**: Server → Client (callee)
- **When**: Server forwards offer to callee
- **Data**:
  ```javascript
  {
    offer: RTCSessionDescriptionInit,
    fromSocketId: string,  // Caller's socket ID
    from: string           // Caller's username
  }
  ```

### `webrtc-answer`
- **Direction**: Client → Server
- **When**: Callee creates WebRTC answer
- **Data**:
  ```javascript
  {
    roomId: string,
    answer: RTCSessionDescriptionInit,  // SDP answer
    targetSocketId: string               // Caller's socket ID
  }
  ```

### `webrtc-answer` (forward)
- **Direction**: Server → Client (caller)
- **When**: Server forwards answer to caller
- **Data**:
  ```javascript
  {
    answer: RTCSessionDescriptionInit,
    fromSocketId: string,  // Callee's socket ID
    from: string           // Callee's username
  }
  ```

### `ice-candidate`
- **Direction**: Client → Server
- **When**: Peer generates ICE candidate
- **Data**:
  ```javascript
  {
    roomId: string,
    candidate: RTCIceCandidate,  // ICE candidate
    targetSocketId: string        // Other peer's socket ID
  }
  ```

### `ice-candidate` (forward)
- **Direction**: Server → Client
- **When**: Server forwards ICE candidate
- **Data**:
  ```javascript
  {
    candidate: RTCIceCandidate,
    fromSocketId: string  // Sender's socket ID
  }
  ```

---

## 📊 Event Flow Diagrams

### Complete Chat Flow

```
User joins → join-room
           ← room-joined (with messages + users)
           
Other joins → user-joined (broadcast)

User types → typing
           ← user-typing (to other)
           
User sends → send-message
           ← message-sent (confirmation)
           ← new-message (to other user)
           
User views → messages-read
           ← messages-marked-read (to sender)
           
User leaves → leave-room / disconnect
            ← user-left (broadcast)
```

### Complete Call Flow

```
Caller initiates → call-user
                 ← incoming-call (to callee)
                 
Callee accepts → call-accepted
               ← call-accepted (to caller)
               
Caller creates offer → webrtc-offer
                     ← webrtc-offer (to callee)
                     
Callee creates answer → webrtc-answer
                      ← webrtc-answer (to caller)
                      
Both exchange → ice-candidate
              ← ice-candidate
              (multiple times for NAT traversal)
              
[Direct P2P media connection established]

Either ends → call-ended
            ← call-ended (to other)
```

---

## 🔍 Implementation Notes

### Room Cleanup
- When user disconnects, server removes them from room
- Messages are cleared when user leaves (ephemeral)
- Empty rooms are automatically deleted

### Message Storage
- Messages stored in-memory only
- Maximum capacity: RAM dependent
- No persistence across restarts

### WebRTC Flow
- Signaling goes through Socket.IO
- Media goes directly peer-to-peer
- STUN servers for NAT traversal
- TURN servers needed for restrictive networks

### Error Handling
- All events have error responses
- Timeouts handled on client side
- Reconnection handled by Socket.IO

---

## 🧪 Testing Events

You can test events using browser console:

```javascript
// Get socket from window (expose it in useSocket.js for testing)
const socket = window.socket;

// Send a test message
socket.emit('send-message', { 
  roomId: 'test123', 
  text: 'Hello from console!' 
});

// Listen for events
socket.on('new-message', (data) => {
  console.log('Received message:', data);
});
```

---

**For implementation details, see:**
- Backend: `backend/server.js` and `backend/webrtc-signaling.js`
- Frontend: `frontend/src/hooks/useSocket.js` and component files
