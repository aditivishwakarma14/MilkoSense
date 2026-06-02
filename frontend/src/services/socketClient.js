import { io } from 'socket.io-client';

const getSocketURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  return window.location.origin;
};

class SocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // Connect to the Express server websocket channel
  connect(onStateChange) {
    if (this.socket?.connected) return;

    const url = getSocketURL();
    console.log(`[Socket Client] Initializing WebSocket link to: ${url}`);

    this.socket = io(url, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
      autoConnect: true,
    });

    // Listeners for socket states
    this.socket.on('connect', () => {
      console.log('[Socket Client] WebSocket stream established successfully.');
      if (onStateChange) onStateChange('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.warn(`[Socket Client] Stream disconnected: ${reason}`);
      if (onStateChange) onStateChange('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket Client] Connection failed:', error.message);
      if (onStateChange) onStateChange('connect_error', error);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket Client] Reconnect attempt #${attempt}`);
      if (onStateChange) onStateChange('reconnecting', { attempt });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[Socket Client] Failed to reconnect after maximum retries.');
      if (onStateChange) onStateChange('reconnect_failed');
    });
  }

  // Disconnect cleanly from the server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[Socket Client] WebSocket manually closed.');
    }
  }

  // Listen for specific telemetry and grading events
  on(event, callback) {
    if (!this.socket) {
      console.warn('[Socket Client] Warning: Cannot bind event; socket not initialized.');
      return;
    }
    
    // Unbind existing listener for this event to avoid duplicates
    this.socket.off(event);
    
    this.socket.on(event, (data) => {
      callback(data);
    });
  }

  // Remove listener
  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

const socketClient = new SocketClient();
export default socketClient;
