const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { apiError } = require('../utils/apiResponse');
const { query } = require('../db/query');

const requireAuth = async (req, res, next) => {
  const cookieName = env.AUTH_COOKIE_NAME;
  let token = req.cookies?.[cookieName];
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  if (!token) {
    console.error('[Auth] Missing or invalid authorization (no cookie or Bearer header)');
    return res.status(401).json(apiError('Unauthorized: Missing or invalid authorization header', 'UNAUTHORIZED'));
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const userId = payload.id;
    if (!userId) {
      return res.status(401).json(apiError('User not found. Please log out and log in again.', 'ERR_USER_NOT_FOUND'));
    }
    const rows = await query(
      `SELECT u.id, u.status, r.name as role 
       FROM users u 
       JOIN roles r ON r.id = u.role_id 
       WHERE u.id = ? AND u.status = ? LIMIT 1`, 
      [userId, 'active']
    );
    if (!rows || rows.length === 0) {
      console.error('[Auth] User not found or inactive:', userId);
      return res.status(401).json(apiError('User not found. Please log out and log in again.', 'ERR_USER_NOT_FOUND'));
    }
    
    req.user = {
      id: payload.id,
      email: payload.email,
      role: rows[0].role, // Use fresh role from database
    };
    
    if (req.path && req.path.includes('/pos')) {
      console.log('[Auth] PO request authenticated:', {
        userId: userId.substring(0, 8) + '...',
        role: rows[0].role,
        path: req.path
      });
    }
    
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      console.error('[Auth] Token verification failed:', err.message);
      return res.status(401).json(apiError('Unauthorized: Invalid or expired token', 'INVALID_TOKEN'));
    }
    return next(err);
  }
};

module.exports = { requireAuth };