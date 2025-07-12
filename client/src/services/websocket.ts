import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

interface WebSocketEvents {
  // Swap events
  'swap:request': (data: any) => void;
  'swap:accepted': (data: any) => void;
  'swap:rejected': (data: any) => void;
  'swap:completed': (data: any) => void;
  
  // Message events
  'message:new': (data: any) => void;
  'message:read': (data: any) => void;
  
  // Notification events
  'notification:new': (data: any) => void;
  'notification:read': (data: any) => void;
  
  // User events
  'user:online': (data: any) => void;
  'user:offline': (data: any) => void;
  'user:updated': (data: any) => void;
  
  // System events
  'system:maintenance': (data: any) => void;
  'system:update': (data: any) => void;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    this.setupEventHandlers();
  }

  connect(token: string): void {
    if (this.socket) {
      this.disconnect();
    }

    try {
      this.socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      toast.error('Failed to connect to real-time services');
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('WebSocket connected successfully');
      this.emitEvent('connection:established', { timestamp: new Date() });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('WebSocket disconnected:', reason);
      this.emitEvent('connection:lost', { reason, timestamp: new Date() });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Unable to connect to real-time services. Please refresh the page.');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      toast.success('Reconnected to real-time services');
    });

    // Set up event listeners for all defined events
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Swap events
    this.socket.on('swap:request', (data) => {
      this.emitEvent('swap:request', data);
      toast(`New swap request from ${data.fromUser?.name || 'User'}`, { icon: '📨' });
    });

    this.socket.on('swap:accepted', (data) => {
      this.emitEvent('swap:accepted', data);
      toast.success(`Swap request accepted by ${data.toUser?.name || 'User'}`);
    });

    this.socket.on('swap:rejected', (data) => {
      this.emitEvent('swap:rejected', data);
      toast.error(`Swap request rejected by ${data.toUser?.name || 'User'}`);
    });

    this.socket.on('swap:completed', (data) => {
      this.emitEvent('swap:completed', data);
      toast.success('Swap completed! Don\'t forget to rate your experience.');
    });

    // Message events
    this.socket.on('message:new', (data) => {
      this.emitEvent('message:new', data);
      toast(`New message from ${data.fromUser?.name || 'User'}`, { icon: '💬' });
    });

    this.socket.on('message:read', (data) => {
      this.emitEvent('message:read', data);
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      this.emitEvent('notification:new', data);
      
      // Show toast for high priority notifications
      if (data.priority === 'high') {
        toast(data.title, { icon: '🔔' });
      }
    });

    this.socket.on('notification:read', (data) => {
      this.emitEvent('notification:read', data);
    });

    // User events
    this.socket.on('user:online', (data) => {
      this.emitEvent('user:online', data);
    });

    this.socket.on('user:offline', (data) => {
      this.emitEvent('user:offline', data);
    });

    this.socket.on('user:updated', (data) => {
      this.emitEvent('user:updated', data);
    });

    // System events
    this.socket.on('system:maintenance', (data) => {
      this.emitEvent('system:maintenance', data);
      toast('System maintenance scheduled. Please save your work.', { icon: '⚠️' });
    });

    this.socket.on('system:update', (data) => {
      this.emitEvent('system:update', data);
      toast('System update available. Please refresh the page.', { icon: '🔄' });
    });
  }

  private setupEventHandlers(): void {
    // Initialize event handlers map
    this.eventHandlers = new Map();
  }

  private emitEvent(eventName: string, data: any): void {
    const handlers = this.eventHandlers.get(eventName) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
  }

  // Public methods for event handling
  on(eventName: string, handler: Function): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);
  }

  off(eventName: string, handler: Function): void {
    const handlers = this.eventHandlers.get(eventName) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  // Public methods for emitting events
  emit(eventName: string, data?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('WebSocket not connected. Cannot emit event:', eventName);
    }
  }

  // Specific methods for common operations
  joinRoom(room: string): void {
    this.emit('join:room', { room });
  }

  leaveRoom(room: string): void {
    this.emit('leave:room', { room });
  }

  sendMessage(swapId: number, message: string): void {
    this.emit('message:send', { swapId, message });
  }

  markNotificationAsRead(notificationId: number): void {
    this.emit('notification:mark_read', { notificationId });
  }

  updateUserStatus(status: 'online' | 'offline' | 'away'): void {
    this.emit('user:status', { status });
  }

  // Connection management
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventHandlers.clear();
    }
  }

  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    }
  }

  // Utility methods
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Performance monitoring
  getStats(): any {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      eventHandlers: this.eventHandlers.size,
      socketId: this.socket?.id,
    };
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;