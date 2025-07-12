import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger, loggers } from '../utils/logger';
import { redisService } from './redis';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface SocketUser {
  id: number;
  name: string;
  email: string;
  role: string;
  socketId: string;
  connectedAt: Date;
}

interface NotificationPayload {
  type: 'swap_request' | 'swap_accepted' | 'swap_rejected' | 'swap_completed' | 'rating_received' | 'skill_endorsed' | 'system_message';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
}

interface SwapUpdatePayload {
  swapId: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  fromUser: {
    id: number;
    name: string;
  };
  toUser: {
    id: number;
    name: string;
  };
  message?: string;
}

interface MessagePayload {
  id: number;
  swapId: number;
  fromUserId: number;
  toUserId: number;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachmentUrl?: string;
  createdAt: Date;
}

interface UserStatusPayload {
  userId: number;
  isOnline: boolean;
  lastSeen: Date;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<number, SocketUser> = new Map();
  private userSockets: Map<number, string[]> = new Map(); // Multiple sockets per user

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    loggers.system.startup('WebSocket Server', undefined);
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as any;
        
        if (!decoded || !decoded.userId) {
          return next(new Error('Invalid token'));
        }

        // Attach user info to socket
        socket.userId = decoded.userId;
        socket.user = {
          id: decoded.userId,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
        };

        next();
      } catch (error) {
        loggers.websocket.error(0, error as Error);
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const userId = socket.userId!;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 100;

      // Simple rate limiting using Redis
      redisService.get(`rate_limit:${userId}`).then(count => {
        const requestCount = parseInt(count || '0');
        
        if (requestCount >= maxRequests) {
          loggers.security.rateLimit(socket.handshake.address, 'websocket');
          return next(new Error('Rate limit exceeded'));
        }

        redisService.set(`rate_limit:${userId}`, (requestCount + 1).toString(), 60);
        next();
      }).catch(() => {
        // Continue without rate limiting if Redis fails
        next();
      });
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
      this.handleDisconnection(socket);
      this.handleUserEvents(socket);
      this.handleSwapEvents(socket);
      this.handleMessageEvents(socket);
      this.handleNotificationEvents(socket);
    });
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    const user = socket.user!;

    // Store user connection
    const socketUser: SocketUser = {
      ...user,
      socketId: socket.id,
      connectedAt: new Date(),
    };

    this.connectedUsers.set(userId, socketUser);
    
    // Handle multiple sockets per user
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)!.push(socket.id);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Set user online status
    this.setUserOnline(userId);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Successfully connected to Skill Swap Platform',
      userId,
      timestamp: new Date().toISOString(),
    });

    // Broadcast user online status
    this.broadcastUserStatus(userId, true);

    // Send pending notifications
    this.sendPendingNotifications(userId);

    loggers.websocket.connected(userId, socket.id);
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    socket.on('disconnect', (reason: string) => {
      const userId = socket.userId!;
      
      if (userId) {
        // Remove socket from user's socket list
        const userSockets = this.userSockets.get(userId);
        if (userSockets) {
          const index = userSockets.indexOf(socket.id);
          if (index > -1) {
            userSockets.splice(index, 1);
          }
          
          // If no more sockets, user is offline
          if (userSockets.length === 0) {
            this.connectedUsers.delete(userId);
            this.userSockets.delete(userId);
            this.setUserOffline(userId);
            this.broadcastUserStatus(userId, false);
          }
        }

        loggers.websocket.disconnected(userId, socket.id);
      }
    });
  }

  private handleUserEvents(socket: AuthenticatedSocket): void {
    // User typing indicators
    socket.on('typing:start', (data: { swapId: number; toUserId: number }) => {
      socket.to(`user:${data.toUserId}`).emit('typing:start', {
        swapId: data.swapId,
        userId: socket.userId,
        userName: socket.user?.name,
      });
    });

    socket.on('typing:stop', (data: { swapId: number; toUserId: number }) => {
      socket.to(`user:${data.toUserId}`).emit('typing:stop', {
        swapId: data.swapId,
        userId: socket.userId,
      });
    });

    // User presence updates
    socket.on('presence:update', (data: { status: 'online' | 'away' | 'busy' }) => {
      const userId = socket.userId!;
      
      // Update user status in cache
      redisService.hashSet(`user:${userId}:presence`, 'status', data.status);
      
      // Broadcast to relevant users (friends, active swaps)
      this.broadcastToUserContacts(userId, 'presence:update', {
        userId,
        status: data.status,
        timestamp: new Date().toISOString(),
      });
    });

    // Join specific rooms
    socket.on('join:room', (data: { room: string }) => {
      socket.join(data.room);
      socket.emit('joined:room', { room: data.room });
    });

    socket.on('leave:room', (data: { room: string }) => {
      socket.leave(data.room);
      socket.emit('left:room', { room: data.room });
    });
  }

  private handleSwapEvents(socket: AuthenticatedSocket): void {
    // Swap request events
    socket.on('swap:request', (data: SwapUpdatePayload) => {
      this.notifyUser(data.toUser.id, 'swap_request', {
        type: 'swap_request',
        title: 'New Skill Swap Request',
        message: `${data.fromUser.name} wants to swap skills with you`,
        data: data,
        priority: 'high',
      });

      loggers.websocket.message(socket.userId!, 'swap:request', data);
    });

    socket.on('swap:accept', (data: SwapUpdatePayload) => {
      this.notifyUser(data.fromUser.id, 'swap_accepted', {
        type: 'swap_accepted',
        title: 'Skill Swap Accepted',
        message: `${data.toUser.name} accepted your skill swap request`,
        data: data,
        priority: 'high',
      });

      // Broadcast to both users
      this.io.to(`user:${data.fromUser.id}`).to(`user:${data.toUser.id}`).emit('swap:updated', data);
    });

    socket.on('swap:reject', (data: SwapUpdatePayload) => {
      this.notifyUser(data.fromUser.id, 'swap_rejected', {
        type: 'swap_rejected',
        title: 'Skill Swap Rejected',
        message: `${data.toUser.name} rejected your skill swap request`,
        data: data,
        priority: 'medium',
      });

      this.io.to(`user:${data.fromUser.id}`).emit('swap:updated', data);
    });

    socket.on('swap:complete', (data: SwapUpdatePayload) => {
      // Notify both users
      this.notifyUser(data.fromUser.id, 'swap_completed', {
        type: 'swap_completed',
        title: 'Skill Swap Completed',
        message: `Your skill swap with ${data.toUser.name} is now complete`,
        data: data,
        priority: 'medium',
      });

      this.notifyUser(data.toUser.id, 'swap_completed', {
        type: 'swap_completed',
        title: 'Skill Swap Completed',
        message: `Your skill swap with ${data.fromUser.name} is now complete`,
        data: data,
        priority: 'medium',
      });

      this.io.to(`user:${data.fromUser.id}`).to(`user:${data.toUser.id}`).emit('swap:updated', data);
    });

    socket.on('swap:cancel', (data: SwapUpdatePayload) => {
      const otherUserId = data.fromUser.id === socket.userId ? data.toUser.id : data.fromUser.id;
      
      this.notifyUser(otherUserId, 'swap_cancelled', {
        type: 'system_message',
        title: 'Skill Swap Cancelled',
        message: `A skill swap has been cancelled`,
        data: data,
        priority: 'low',
      });

      this.io.to(`user:${otherUserId}`).emit('swap:updated', data);
    });
  }

  private handleMessageEvents(socket: AuthenticatedSocket): void {
    socket.on('message:send', (data: Omit<MessagePayload, 'id' | 'createdAt'>) => {
      const message: MessagePayload = {
        ...data,
        id: Date.now(), // Temporary ID, should be replaced with DB ID
        createdAt: new Date(),
      };

      // Send to recipient
      this.io.to(`user:${data.toUserId}`).emit('message:receive', message);
      
      // Confirm to sender
      socket.emit('message:sent', { tempId: message.id, message });

      loggers.websocket.message(socket.userId!, 'message:send', data);
    });

    socket.on('message:read', (data: { messageId: number; swapId: number }) => {
      // Notify sender that message was read
      this.io.to(`swap:${data.swapId}`).emit('message:read', {
        messageId: data.messageId,
        readBy: socket.userId,
        readAt: new Date().toISOString(),
      });
    });
  }

  private handleNotificationEvents(socket: AuthenticatedSocket): void {
    socket.on('notification:mark_read', (data: { notificationId: number }) => {
      // Mark notification as read in database
      socket.emit('notification:marked_read', {
        notificationId: data.notificationId,
        readAt: new Date().toISOString(),
      });
    });

    socket.on('notification:mark_all_read', () => {
      // Mark all notifications as read for user
      socket.emit('notification:all_marked_read', {
        userId: socket.userId,
        readAt: new Date().toISOString(),
      });
    });
  }

  // Public methods for emitting events from other parts of the application
  public notifyUser(userId: number, event: string, data: NotificationPayload): void {
    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Store notification for offline users
    if (!this.connectedUsers.has(userId)) {
      this.storeOfflineNotification(userId, event, data);
    }
  }

  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  public broadcastToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  public sendSystemMessage(userId: number, message: string): void {
    this.notifyUser(userId, 'system_message', {
      type: 'system_message',
      title: 'System Message',
      message,
      priority: 'medium',
    });
  }

  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }

  public isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  private async setUserOnline(userId: number): Promise<void> {
    try {
      await redisService.setUserOnline(userId);
    } catch (error) {
      loggers.websocket.error(userId, error as Error);
    }
  }

  private async setUserOffline(userId: number): Promise<void> {
    try {
      await redisService.setUserOffline(userId);
    } catch (error) {
      loggers.websocket.error(userId, error as Error);
    }
  }

  private broadcastUserStatus(userId: number, isOnline: boolean): void {
    const payload: UserStatusPayload = {
      userId,
      isOnline,
      lastSeen: new Date(),
    };

    // Broadcast to users who might be interested (friends, active swaps)
    this.broadcastToUserContacts(userId, 'user:status', payload);
  }

  private async broadcastToUserContacts(userId: number, event: string, data: any): Promise<void> {
    try {
      // Get user's contacts from cache or database
      const contacts = await this.getUserContacts(userId);
      
      contacts.forEach(contactId => {
        this.io.to(`user:${contactId}`).emit(event, data);
      });
    } catch (error) {
      loggers.websocket.error(userId, error as Error);
    }
  }

  private async getUserContacts(userId: number): Promise<number[]> {
    try {
      // Get from cache first
      const cachedContacts = await redisService.getObject<number[]>(`user:${userId}:contacts`);
      if (cachedContacts) {
        return cachedContacts;
      }

      // TODO: Implement database query to get user's contacts
      // For now, return empty array
      return [];
    } catch (error) {
      loggers.websocket.error(userId, error as Error);
      return [];
    }
  }

  private async sendPendingNotifications(userId: number): Promise<void> {
    try {
      const notifications = await redisService.getObject<NotificationPayload[]>(`user:${userId}:pending_notifications`);
      
      if (notifications && notifications.length > 0) {
        notifications.forEach(notification => {
          this.io.to(`user:${userId}`).emit('notification:pending', notification);
        });
        
        // Clear pending notifications
        await redisService.del(`user:${userId}:pending_notifications`);
      }
    } catch (error) {
      loggers.websocket.error(userId, error as Error);
    }
  }

  private async storeOfflineNotification(userId: number, event: string, data: NotificationPayload): Promise<void> {
    try {
      const key = `user:${userId}:pending_notifications`;
      const notifications = await redisService.getObject<NotificationPayload[]>(key) || [];
      
      notifications.push(data);
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(0, notifications.length - 50);
      }
      
      await redisService.setObject(key, notifications, 86400); // 24 hours TTL
    } catch (error) {
      loggers.websocket.error(userId, error as Error);
    }
  }

  public getStats(): {
    connectedUsers: number;
    totalConnections: number;
    rooms: string[];
  } {
    return {
      connectedUsers: this.connectedUsers.size,
      totalConnections: this.userSockets.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
    };
  }
}

// Export singleton instance
let websocketService: WebSocketService;

export const initializeWebSocket = (server: HTTPServer): WebSocketService => {
  websocketService = new WebSocketService(server);
  return websocketService;
};

export const getWebSocketService = (): WebSocketService => {
  if (!websocketService) {
    throw new Error('WebSocket service not initialized');
  }
  return websocketService;
};