const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

/**
 * Get client IP address, handling proxies and X-Forwarded-For headers
 */
const getClientIp = (req) => {
  // Check X-Forwarded-For header (for reverse proxies)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one (original client)
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  // Check X-Real-IP header (some proxies use this)
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  
  // Fallback to Express's req.ip (requires trust proxy to be set)
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

/**
 * Check if request is from localhost/development
 */
const isDevelopment = () => {
  return env.NODE_ENV === 'development' || env.NODE_ENV !== 'production';
};

/**
 * Check if IP is localhost
 */
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

// General API rate limiter (more lenient)
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT_MAX || 300, // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  keyGenerator: (req) => {
    // Use IP address for general rate limiting
    return getClientIp(req);
  },
  skip: (req) => {
    // Skip rate limiting for health checks, auth endpoints, and profile endpoints (they have their own limiters)
    const path = req.path || '';
    return path === '/health' || 
           path.startsWith('/health/') ||
           path.includes('/auth/') || 
           path.includes('/user/profile');
  },
});

// Environment-aware rate limiter for authentication endpoints
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
    // Use IP + email for more granular rate limiting on auth endpoints
    const ip = getClientIp(req);
    const email = req.body?.email || req.body?.email?.toLowerCase() || '';
    
    // In development/localhost, be more lenient
    if (isDevelopment() && isLocalhost(ip)) {
      return `dev:${ip}`; // Single key for all localhost requests in dev
    }
    
    // In production, use IP+email for better security
    if (email) {
      return `auth:${ip}:${email.toLowerCase()}`;
    }
    
    // Fallback to IP only if no email provided
    return `auth:${ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for localhost in development
    if (isDevelopment()) {
      const ip = getClientIp(req);
      return isLocalhost(ip);
    }
    return false;
  },
  // Don't count successful logins against rate limit (only failed attempts)
  skipSuccessfulRequests: true,
  // Count failed requests
  skipFailedRequests: false,
  // Custom handler for better error messages
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

// Very lenient rate limiter for profile endpoints (to prevent 429 errors)
// Profile endpoints are authenticated and should have high limits
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
