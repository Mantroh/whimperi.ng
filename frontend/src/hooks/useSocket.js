import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../config';

/**
 * Custom hook for Socket.IO connection and event handling
 * Provides a clean API for managing WebSocket events
 */
export function useSocket() {
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    console.log('🔌 Initializing Socket.IO connection to:', SERVER_URL);
    
    socketRef.current = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Connected to server:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server. Reason:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message || error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Emit event to server
  const emit = useCallback((event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log(`📤 Emitting event: ${event}`, data);
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event} - socket not connected`, {
        exists: !!socketRef.current,
        connected: socketRef.current?.connected
      });
    }
  }, []);

  // Listen for event from server
  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      console.log(`👂 Listening for event: ${event}`);
      socketRef.current.on(event, (data) => {
        console.log(`📩 Received event: ${event}`, data);
        handler(data);
      });
      
      // Track listener for cleanup
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, []);
      }
      listenersRef.current.get(event).push(handler);
    }
  }, []);

  // Remove event listener
  const off = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
      
      // Remove from tracked listeners
      const handlers = listenersRef.current.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }
  }, []);

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    isConnected
  };
}
