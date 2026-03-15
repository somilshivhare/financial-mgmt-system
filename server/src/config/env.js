const dotenv = require('dotenv');

dotenv.config();

const required = (key, fallback = undefined) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
};

const requiredProduction = (key) => {
  const value = process.env[key];
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && (!value || value === '')) {
    throw new Error(`Missing required env var ${key} in production environment`);
  }
  
  if (!value || value === '') {
    if (!isProduction) {
      console.warn(`Warning: ${key} is not set. This will cause errors in production.`);
    }
    return undefined;
  }
  
  return value;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4000,
  JWT_SECRET: requiredProduction('JWT_SECRET'), // No fallback - will throw in production if missing
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 10),
  DB_HOST: required('DB_HOST', 'localhost'),
  DB_USER: required('DB_USER', 'root'),
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: required('DB_NAME', 'erp_db'),
  DB_PORT: Number(process.env.DB_PORT || 3306),
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 300),
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX || 50), // Auth requests per window in production
  AUTH_RATE_LIMIT_WINDOW_MS: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:3000']),
  /** Cookie name for HTTP-only auth token (no token in response body when using cookie) */
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME || 'auth_token',
};

/** Parse JWT_EXPIRES_IN (e.g. '1d', '24h', '7d') to seconds for cookie maxAge */
function authCookieMaxAgeSeconds() {
  const raw = process.env.JWT_EXPIRES_IN || '1d';
  const match = raw.trim().match(/^(\d+)(d|h|m|s)?$/i);
  if (!match) return 86400; // default 1 day
  const n = parseInt(match[1], 10);
  const unit = (match[2] || 'd').toLowerCase();
  if (unit === 'd') return n * 24 * 60 * 60;
  if (unit === 'h') return n * 60 * 60;
  if (unit === 'm') return n * 60;
  return n;
}

module.exports = { env, authCookieMaxAgeSeconds };