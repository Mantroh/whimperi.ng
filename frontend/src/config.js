/**
 * Environment configuration for Socket.IO connection
 * Update SERVER_URL based on your deployment
 */

// Detect if running in production
const isProduction = window.location.hostname !== 'localhost';

// Use same origin in production, localhost in development
export const SERVER_URL = isProduction 
  ? window.location.origin  // Production: same domain
  : 'http://localhost:3000'; // Development: explicit port

export const config = {
  serverUrl: SERVER_URL,
  socketOptions: {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  }
};
