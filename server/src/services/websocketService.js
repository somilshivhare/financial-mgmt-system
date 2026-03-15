const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { query } = require('../db/query');

let io = null;
const userSockets = new Map(); // Map userId -> Set of socketIds
const userRoles = new Map(); // Map userId -> role

const initializeWebSocket = (httpServer) => {
  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      
      if (env.NODE_ENV !== 'production') {
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
      }
      
      if (env.ALLOWED_ORIGINS.length === 0) {
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

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers?.cookie;
      const parsed = cookieHeader ? cookie.parse(cookieHeader) : {};
      const token = parsed[env.AUTH_COOKIE_NAME] || socket.handshake.auth?.token || socket.handshake.query?.token;
      
      if (!token) {
        console.warn(`[WebSocket] Connection rejected: No token provided for socket ${socket.id}`);
        return next(new Error('Authentication error: No token provided'));
      }

      let payload;
      try {
        payload = jwt.verify(token, env.JWT_SECRET);
      } catch (jwtError) {
        console.warn(`[WebSocket] Connection rejected: Invalid token for socket ${socket.id}`, jwtError.message);
        return next(new Error('Authentication error: Invalid token'));
      }

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

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    userRoles.set(userId, userRole);

    socket.join(`user:${userId}`);
    
    if (userRole) {
      socket.join(`role:${userRole}`);
    }

    socket.emit('authenticated', { 
      success: true, 
      userId,
      role: userRole,
      message: 'WebSocket connection authenticated' 
    });

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

    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('reconnect_attempt', () => {
      console.log(`[WebSocket] Reconnection attempt for ${socket.id} (User: ${userId})`);
    });
  });

  console.log('[WebSocket] Socket.IO server initialized and ready for connections');

  return io;
};

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

const sendNotificationToRole = async (roleName, notification) => {
  if (!io) {
    console.warn('[WebSocket] Cannot send notification: Socket.IO not initialized');
    return false;
  }
  
  try {
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

const getIO = () => io;

const isUserConnected = (userId) => {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
};

const getConnectedUsersCount = () => {
  return userSockets.size;
};

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
