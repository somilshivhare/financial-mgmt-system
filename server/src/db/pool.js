const mysql = require('mysql2/promise');
const { env } = require('../config/env');


const DB_CONNECTION_CONFIG = {
  MAX_RETRY_ATTEMPTS: Number(process.env.DB_MAX_RETRY_ATTEMPTS || 5),
  INITIAL_RETRY_DELAY_MS: Number(process.env.DB_INITIAL_RETRY_DELAY_MS || 1000),
  MAX_RETRY_DELAY_MS: Number(process.env.DB_MAX_RETRY_DELAY_MS || 30000),
  RETRY_MULTIPLIER: Number(process.env.DB_RETRY_MULTIPLIER || 2),
  
  CONNECTION_LIMIT: Number(process.env.DB_CONNECTION_LIMIT || 10),
  QUEUE_LIMIT: Number(process.env.DB_QUEUE_LIMIT || 0),
  CONNECT_TIMEOUT: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
  ACQUIRE_TIMEOUT: Number(process.env.DB_ACQUIRE_TIMEOUT || 60000),
};

const healthState = {
  isHealthy: false,
  lastCheck: null,
  consecutiveFailures: 0,
  lastError: null,
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const calculateBackoffDelay = (attempt, baseDelay, maxDelay, multiplier) => {
  const delay = Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay);
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
};

const isTransientError = (error) => {
  if (!error) return false;
  
  const errorCode = error.code;
  const errorMessage = error.message?.toLowerCase() || '';
  
  const transientCodes = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'PROTOCOL_CONNECTION_LOST',
    'PROTOCOL_ENQUEUE_AFTER_QUIT',
    'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
    'PROTOCOL_PACKETS_OUT_OF_ORDER',
    'ER_LOCK_WAIT_TIMEOUT',
    'ER_LOCK_DEADLOCK',
  ];
  
  if (transientCodes.includes(errorCode)) {
    return true;
  }
  
  const transientPatterns = [
    'connection lost',
    'connection closed',
    'timeout',
    'network',
    'temporary failure',
    'try again',
    'deadlock',
  ];
  
  return transientPatterns.some(pattern => errorMessage.includes(pattern));
};

const verifyConnection = async (connection = null) => {
  const conn = connection || pool;
  try {
    await conn.execute('SELECT 1 as health_check');
    return true;
  } catch (error) {
    return false;
  }
};

const initializeWithRetry = async (maxAttempts = DB_CONNECTION_CONFIG.MAX_RETRY_ATTEMPTS) => {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    try {
      const isConnected = await verifyConnection();
      
      if (isConnected) {
        healthState.isHealthy = true;
        healthState.lastCheck = new Date();
        healthState.consecutiveFailures = 0;
        healthState.lastError = null;
        
        if (attempt > 0) {
          console.log(`✓ Database connection established after ${attempt} retry attempt(s)`);
        } else {
          console.log('✓ Database connection established');
        }
        
        return true;
      }
    } catch (error) {
      healthState.lastError = error;
      healthState.consecutiveFailures++;
      
      if (!isTransientError(error)) {
        console.error('✗ Database connection failed with non-transient error:', error.message);
        healthState.isHealthy = false;
        return false;
      }
      
      const delay = calculateBackoffDelay(
        attempt,
        DB_CONNECTION_CONFIG.INITIAL_RETRY_DELAY_MS,
        DB_CONNECTION_CONFIG.MAX_RETRY_DELAY_MS,
        DB_CONNECTION_CONFIG.RETRY_MULTIPLIER
      );
      
      attempt++;
      
      if (attempt < maxAttempts) {
        console.warn(
          `⚠ Database connection attempt ${attempt}/${maxAttempts} failed. ` +
          `Retrying in ${Math.round(delay)}ms... (Error: ${error.code || error.message})`
        );
        await sleep(delay);
      } else {
        console.error(
          `✗ Database connection failed after ${maxAttempts} attempts. ` +
          `Last error: ${error.code || error.message}`
        );
        healthState.isHealthy = false;
        return false;
      }
    }
  }
  
  healthState.isHealthy = false;
  return false;
};

const getHealthStatus = () => {
  return {
    isHealthy: healthState.isHealthy,
    lastCheck: healthState.lastCheck,
    consecutiveFailures: healthState.consecutiveFailures,
    lastError: healthState.lastError ? {
      code: healthState.lastError.code,
      message: healthState.lastError.message,
    } : null,
    poolStats: {
      totalConnections: pool.pool?._allConnections?.length || 0,
      freeConnections: pool.pool?._freeConnections?.length || 0,
      queuedRequests: pool.pool?._connectionQueue?.length || 0,
    },
  };
};

const performHealthCheck = async () => {
  try {
    const isConnected = await verifyConnection();
    healthState.isHealthy = isConnected;
    healthState.lastCheck = new Date();
    
    if (isConnected) {
      healthState.consecutiveFailures = 0;
      healthState.lastError = null;
    } else {
      healthState.consecutiveFailures++;
    }
    
    return isConnected;
  } catch (error) {
    healthState.isHealthy = false;
    healthState.lastCheck = new Date();
    healthState.consecutiveFailures++;
    healthState.lastError = error;
    return false;
  }
};

const pool = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: env.DB_PORT,
  waitForConnections: true,
  connectionLimit: DB_CONNECTION_CONFIG.CONNECTION_LIMIT,
  queueLimit: DB_CONNECTION_CONFIG.QUEUE_LIMIT,
  connectTimeout: DB_CONNECTION_CONFIG.CONNECT_TIMEOUT,
  acquireTimeout: DB_CONNECTION_CONFIG.ACQUIRE_TIMEOUT,
  multipleStatements: true,
  timezone: 'Z',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

pool.on('connection', (connection) => {
  console.log('New database connection established');
});

pool.on('error', (error) => {
  console.error('Database pool error:', error.message);
  if (isTransientError(error)) {
    healthState.lastError = error;
    healthState.lastCheck = new Date();
  } else {
    healthState.isHealthy = false;
    healthState.lastError = error;
  }
});

module.exports = {
  pool,
  initializeWithRetry,
  verifyConnection,
  getHealthStatus,
  performHealthCheck,
  isTransientError,
  DB_CONNECTION_CONFIG,
};