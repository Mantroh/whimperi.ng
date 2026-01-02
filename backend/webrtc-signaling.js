/**
 * WebRTC Signaling Module
 * Handles signaling for peer-to-peer audio/video calls
 * 
 * Flow:
 * 1. User A calls User B -> 'call-user' event
 * 2. User B receives 'incoming-call' event
 * 3. User B accepts -> 'call-accepted' event
 * 4. WebRTC offer/answer exchange via 'webrtc-offer' and 'webrtc-answer'
 * 5. ICE candidates exchanged via 'ice-candidate'
 * 6. Direct media connection established between peers
 */

module.exports = function(io, socketToRoom, rooms) {
  
  io.on('connection', (socket) => {
    
    /**
     * INITIATE CALL
     * User wants to call another user in the room
     */
    socket.on('call-user', ({ roomId, isVideo }) => {
      const userInfo = socketToRoom.get(socket.id);
      if (!userInfo || userInfo.roomId !== roomId) {
        return;
      }

      const room = rooms.get(roomId);
      if (!room || room.users.length < 2) {
        socket.emit('call-error', { message: 'Cannot initiate call - room not ready' });
        return;
      }

      // Find the other user
      const otherUser = room.users.find(u => u.socketId !== socket.id);
      if (!otherUser) {
        socket.emit('call-error', { message: 'Other user not found' });
        return;
      }

      console.log(`📞 ${userInfo.username} calling ${otherUser.username} (video: ${isVideo})`);

      // Notify the other user about incoming call
      io.to(otherUser.socketId).emit('incoming-call', {
        from: userInfo.username,
        fromSocketId: socket.id,
        roomId,
        isVideo
      });
    });

    /**
     * ACCEPT CALL
     */
    socket.on('call-accepted', ({ roomId, fromSocketId }) => {
      const userInfo = socketToRoom.get(socket.id);
      if (!userInfo) return;

      console.log(`✅ ${userInfo.username} accepted call`);

      // Notify the caller that call was accepted
      io.to(fromSocketId).emit('call-accepted', {
        from: userInfo.username,
        fromSocketId: socket.id
      });
    });

    /**
     * REJECT CALL
     */
    socket.on('call-rejected', ({ roomId, fromSocketId }) => {
      const userInfo = socketToRoom.get(socket.id);
      if (!userInfo) return;

      console.log(`❌ ${userInfo.username} rejected call`);

      // Notify the caller that call was rejected
      io.to(fromSocketId).emit('call-rejected', {
        from: userInfo.username
      });
    });

    /**
     * END CALL
     */
    socket.on('call-ended', ({ roomId }) => {
      const userInfo = socketToRoom.get(socket.id);
      if (!userInfo) return;

      console.log(`📴 ${userInfo.username} ended call`);

      // Notify other user in the room
      socket.to(roomId).emit('call-ended', {
        from: userInfo.username
      });
    });

    /**
     * WEBRTC OFFER
     * Sent by the caller after call is accepted
     */
    socket.on('webrtc-offer', ({ roomId, offer, targetSocketId }) => {
      const userInfo = socketToRoom.get(socket.id);
      if (!userInfo) return;

      console.log(`📤 WebRTC offer from ${userInfo.username}`);

      // Forward offer to the target user
      io.to(targetSocketId).emit('webrtc-offer', {
        offer,
        fromSocketId: socket.id,
        from: userInfo.username
      });
    });

    /**
     * WEBRTC ANSWER
     * Sent by the callee in response to offer
     */
    socket.on('webrtc-answer', ({ roomId, answer, targetSocketId }) => {
      const userInfo = socketToRoom.get(socket.id);
      if (!userInfo) return;

      console.log(`📥 WebRTC answer from ${userInfo.username}`);

      // Forward answer to the caller
      io.to(targetSocketId).emit('webrtc-answer', {
        answer,
        fromSocketId: socket.id,
        from: userInfo.username
      });
    });

    /**
     * ICE CANDIDATE
     * Exchange ICE candidates for NAT traversal
     */
    socket.on('ice-candidate', ({ roomId, candidate, targetSocketId }) => {
      const userInfo = socketToRoom.get(socket.id);
      if (!userInfo) return;

      // Forward ICE candidate to the other peer
      if (targetSocketId) {
        io.to(targetSocketId).emit('ice-candidate', {
          candidate,
          fromSocketId: socket.id
        });
      }
    });

  });
};
