const dotenv = require('dotenv');

dotenv.config();

const required = (key, fallback = undefined) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4000,
  JWT_SECRET: required('JWT_SECRET', 'change-me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 10),
  DB_HOST: required('DB_HOST', 'localhost'),
  DB_USER: required('DB_USER', 'root'),
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: required('DB_NAME', 'erp_db'),
  DB_PORT: Number(process.env.DB_PORT || 3306),
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 300),
};

module.exports = { env };