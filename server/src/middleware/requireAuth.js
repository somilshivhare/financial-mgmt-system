const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { apiError } = require('../utils/apiResponse');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Auth] Missing or invalid authorization header');
    return res.status(401).json(apiError('Unauthorized: Missing or invalid authorization header', 'UNAUTHORIZED'));
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(401).json(apiError('Unauthorized: Invalid or expired token', 'INVALID_TOKEN'));
  }
};

module.exports = { requireAuth };