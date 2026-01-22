const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { query } = require('../db/query');

let io = null;
const userSockets = new Map(); // Map userId -> Set of socketIds
const userRoles = new Map(); // Map userId -> role

/**
 * Initialize WebSocket server with authentication middleware
 */
const initializeWebSocket = (httpServer) => {
  // Configure CORS for WebSocket - use same origins as HTTP API
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin
      if (!origin) {
        return callback(null, true);
      }
      
      // In development, allow localhost origins
      if (env.NODE_ENV !== 'production') {
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
      }
      
      // Check against allowed origins list
      if (env.ALLOWED_ORIGINS.length === 0) {
        // If no origins configured in production, deny all
        if (env.NODE_ENV === 'production') {
          return callback(new Error('CORS: No allowed origins configured'));
        }
        return callback(null, true);
      }
      
      if (env.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} is not allowed`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  };

  io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling'], // Fallback to polling
    allowEIO3: true, // Support older clients
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      if (!token) {
        console.warn(`[WebSocket] Connection rejected: No token provided for socket ${socket.id}`);
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      let payload;
      try {
        payload = jwt.verify(token, env.JWT_SECRET);
      } catch (jwtError) {
        console.warn(`[WebSocket] Connection rejected: Invalid token for socket ${socket.id}`, jwtError.message);
        return next(new Error('Authentication error: Invalid token'));
      }

      // Attach user info to socket
      socket.userId = payload.id;
      socket.userRole = payload.role;
      socket.userEmail = payload.email;
      
      next();
    } catch (error) {
      console.error('[WebSocket] Authentication middleware error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const userRole = socket.userRole;
    
    console.log(`[WebSocket] Client connected: ${socket.id} (User: ${userId}, Role: ${userRole})`);

    // Register user socket
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    userRoles.set(userId, userRole);

    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Join role-based room
    if (userRole) {
      socket.join(`role:${userRole}`);
    }

    // Emit authenticated event
    socket.emit('authenticated', { 
      success: true, 
      userId,
      role: userRole,
      message: 'WebSocket connection authenticated' 
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] Client disconnected: ${socket.id} (User: ${userId}, Reason: ${reason})`);
      
      if (userId) {
        const userSocketSet = userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            userSockets.delete(userId);
            userRoles.delete(userId);
          }
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
    });

    // Heartbeat to keep connection alive
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle client reconnection
    socket.on('reconnect_attempt', () => {
      console.log(`[WebSocket] Reconnection attempt for ${socket.id} (User: ${userId})`);
    });
  });

  // Log server startup
  console.log('[WebSocket] Socket.IO server initialized and ready for connections');

  return io;
};

/**
 * Send notification to a specific user
 */
const sendNotificationToUser = (userId, notification) => {
  if (!io) {
    console.warn('[WebSocket] Cannot send notification: Socket.IO not initialized');
    return false;
  }
  
  try {
    const isConnected = userSockets.has(userId) && userSockets.get(userId).size > 0;
    
    if (!isConnected) {
      console.log(`[WebSocket] User ${userId} not connected, notification will not be delivered`);
      return false;
    }

    io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`[WebSocket] Notification sent to user ${userId}:`, notification.type || 'notification');
    return true;
  } catch (error) {
    console.error(`[WebSocket] Error sending notification to user ${userId}:`, error);
    return false;
  }
};

/**
 * Send notification to multiple users
 */
const sendNotificationToUsers = (userIds, notification) => {
  if (!io) {
    console.warn('[WebSocket] Cannot send notifications: Socket.IO not initialized');
    return false;
  }
  
  try {
    let sentCount = 0;
    userIds.forEach(userId => {
      if (sendNotificationToUser(userId, notification)) {
        sentCount++;
      }
    });
    
    console.log(`[WebSocket] Notification sent to ${sentCount}/${userIds.length} users`);
    return sentCount > 0;
  } catch (error) {
    console.error('[WebSocket] Error sending notifications to users:', error);
    return false;
  }
};

/**
 * Send notification to all users in a role
 */
const sendNotificationToRole = async (roleName, notification) => {
  if (!io) {
    console.warn('[WebSocket] Cannot send notification: Socket.IO not initialized');
    return false;
  }
  
  try {
    // Get role ID from role name
    const roles = await query('SELECT id FROM roles WHERE name = ?', [roleName]);
    if (roles.length === 0) {
      console.warn(`[WebSocket] Role ${roleName} not found`);
      return false;
    }
    
    const roleId = roles[0].id;
    const users = await query('SELECT id FROM users WHERE role_id = ? AND status = "active"', [roleId]);
    const userIds = users.map(u => u.id);
    
    if (userIds.length === 0) {
      console.log(`[WebSocket] No active users found for role ${roleName}`);
      return false;
    }
    
    // Emit to role room (for connected users)
    io.to(`role:${roleName}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`[WebSocket] Notification sent to role ${roleName} (${userIds.length} users)`);
    return true;
  } catch (error) {
    console.error(`[WebSocket] Error sending notification to role ${roleName}:`, error);
    return false;
  }
};

/**
 * Send notification to all connected users
 */
const sendNotificationToAll = (notification) => {
  if (!io) {
    console.warn('[WebSocket] Cannot send notification: Socket.IO not initialized');
    return false;
  }
  
  try {
    io.emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
    
    console.log('[WebSocket] Notification broadcast to all connected users');
    return true;
  } catch (error) {
    console.error('[WebSocket] Error broadcasting notification:', error);
    return false;
  }
};

/**
 * Get WebSocket instance
 */
const getIO = () => io;

/**
 * Check if user is connected
 */
const isUserConnected = (userId) => {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
};

/**
 * Get connected users count
 */
const getConnectedUsersCount = () => {
  return userSockets.size;
};

/**
 * Get all connected user IDs
 */
const getConnectedUserIds = () => {
  return Array.from(userSockets.keys());
};

module.exports = {
  initializeWebSocket,
  sendNotificationToUser,
  sendNotificationToUsers,
  sendNotificationToRole,
  sendNotificationToAll,
  getIO,
  isUserConnected,
  getConnectedUsersCount,
  getConnectedUserIds,
};
