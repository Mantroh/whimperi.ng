import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../config';

/**
 * Custom hook for Socket.IO connection and event handling
 * Provides a clean API for managing WebSocket events
 */
export function useSocket() {
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Emit event to server
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Listen for event from server
  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
      
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
    off
  };
}
