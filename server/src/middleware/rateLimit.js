const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

const isDevelopment = () => {
  return env.NODE_ENV === 'development' || env.NODE_ENV !== 'production';
};

const isLocalhost = (ip) => {
  return ip === '127.0.0.1' || 
         ip === '::1' || 
         ip === '::ffff:127.0.0.1' ||
         ip === 'localhost' ||
         ip?.startsWith('192.168.') ||
         ip?.startsWith('10.') ||
         ip?.startsWith('172.16.') ||
         ip?.startsWith('172.17.') ||
         ip?.startsWith('172.18.') ||
         ip?.startsWith('172.19.') ||
         ip?.startsWith('172.20.') ||
         ip?.startsWith('172.21.') ||
         ip?.startsWith('172.22.') ||
         ip?.startsWith('172.23.') ||
         ip?.startsWith('172.24.') ||
         ip?.startsWith('172.25.') ||
         ip?.startsWith('172.26.') ||
         ip?.startsWith('172.27.') ||
         ip?.startsWith('172.28.') ||
         ip?.startsWith('172.29.') ||
         ip?.startsWith('172.30.') ||
         ip?.startsWith('172.31.');
};

const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT_MAX || 300, // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  keyGenerator: (req) => {
    return getClientIp(req);
  },
  skip: (req) => {
    if (isDevelopment()) {
      const ip = getClientIp(req);
      if (isLocalhost(ip)) {
        return true;
      }
    }
    
    const path = req.path || '';
    return path === '/health' || 
           path.startsWith('/health/') ||
           path.includes('/auth/') || 
           path.includes('/user/profile') ||
           path.includes('/master-data'); // Skip rate limiting for master data endpoints
  },
});

const authLimiter = rateLimit({
  windowMs: isDevelopment() 
    ? 1 * 60 * 1000  // 1 minute in development
    : 15 * 60 * 1000, // 15 minutes in production
  max: isDevelopment()
    ? 100  // Very lenient in development (100 requests per minute)
    : (env.AUTH_RATE_LIMIT_MAX || 50), // 50 requests per 15 minutes in production (configurable)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts. Please wait a moment and try again.',
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const email = req.body?.email || req.body?.email?.toLowerCase() || '';
    
    if (isDevelopment() && isLocalhost(ip)) {
      return `dev:${ip}`; // Single key for all localhost requests in dev
    }
    
    if (email) {
      return `auth:${ip}:${email.toLowerCase()}`;
    }
    
    return `auth:${ip}`;
  },
  skip: (req) => {
    if (isDevelopment()) {
      const ip = getClientIp(req);
      return isLocalhost(ip);
    }
    return false;
  },
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  handler: (req, res) => {
    const retryAfter = Math.ceil(
      (isDevelopment() ? 1 * 60 : 15 * 60) / 1000
    );
    
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please wait a moment and try again.',
      retryAfter,
      windowMs: isDevelopment() ? 1 * 60 * 1000 : 15 * 60 * 1000,
    });
  },
});

const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window (very lenient for authenticated profile operations)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many profile requests, please try again later.',
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false, // Count failed requests too
});

module.exports = {
  generalLimiter,
  authLimiter,
  profileLimiter,
  getClientIp,
};
