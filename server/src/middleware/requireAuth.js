const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { apiError } = require('../utils/apiResponse');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(apiError('Unauthorized'));
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (_e) {
    return res.status(401).json(apiError('Invalid token'));
  }
};

module.exports = { requireAuth };