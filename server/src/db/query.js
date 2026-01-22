const { pool, isTransientError, DB_CONNECTION_CONFIG } = require('./pool');

/**
 * Sanitize parameters - convert undefined to null for MySQL compatibility
 * MySQL2 doesn't accept undefined values in bind parameters
 */
const sanitizeParams = (params) => {
  if (!Array.isArray(params)) {
    return params;
  }
  return params.map(param => {
    if (param === undefined) {
      return null;
    }
    // Recursively sanitize nested arrays/objects if needed
    if (Array.isArray(param)) {
      return sanitizeParams(param);
    }
    return param;
  });
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if error indicates pool exhaustion
 */
const isPoolExhaustionError = (error) => {
  if (!error) return false;
  
  const errorCode = error.code;
  const errorMessage = error.message?.toLowerCase() || '';
  
  // Pool exhaustion indicators
  const exhaustionCodes = ['ER_CON_COUNT_ERROR', 'PROTOCOL_ENQUEUE_AFTER_QUIT'];
  const exhaustionPatterns = [
    'too many connections',
    'connection limit',
    'pool is full',
    'queue limit',
    'timeout acquiring connection',
  ];
  
  return (
    exhaustionCodes.includes(errorCode) ||
    exhaustionPatterns.some(pattern => errorMessage.includes(pattern))
  );
};

/**
 * Execute query with retry logic for transient errors
 */
const executeWithRetry = async (executeFn, maxRetries = 3, initialDelay = 100) => {
  let attempt = 0;
  let lastError;
  
  while (attempt <= maxRetries) {
    try {
      return await executeFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry non-transient errors
      if (!isTransientError(error) && !isPoolExhaustionError(error)) {
        throw error;
      }
      
      // Don't retry if we've exhausted retries
      if (attempt >= maxRetries) {
        break;
      }
      
      // Calculate backoff delay
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt),
        DB_CONNECTION_CONFIG.MAX_RETRY_DELAY_MS
      );
      
      attempt++;
      
      // Log retry attempt (only in development or for pool exhaustion)
      if (isPoolExhaustionError(error) || process.env.NODE_ENV !== 'production') {
        console.warn(
          `Query retry attempt ${attempt}/${maxRetries} after ${error.code || error.message}. ` +
          `Waiting ${Math.round(delay)}ms...`
        );
      }
      
      await sleep(delay);
    }
  }
  
  // All retries exhausted
  throw lastError;
};

/**
 * Execute a SQL query with automatic parameter sanitization
 * Handles pool exhaustion and transient errors gracefully
 */
const query = async (sql, params = []) => {
  // Sanitize parameters to ensure no undefined values reach MySQL
  const sanitizedParams = sanitizeParams(params);
  
  return executeWithRetry(async () => {
    try {
      const [rows] = await pool.execute(sql, sanitizedParams);
      return rows;
    } catch (error) {
      // Enhance error message for pool exhaustion
      if (isPoolExhaustionError(error)) {
        const poolStats = {
          total: pool.pool?._allConnections?.length || 0,
          free: pool.pool?._freeConnections?.length || 0,
          queued: pool.pool?._connectionQueue?.length || 0,
        };
        
        error.message = `Database connection pool exhausted. ` +
          `Pool stats: ${poolStats.total} total, ${poolStats.free} free, ${poolStats.queued} queued. ` +
          `Original error: ${error.message}`;
      }
      
      throw error;
    }
  });
};

/**
 * Execute a transaction with automatic retry for transient errors
 * Note: Transactions are only retried if they haven't started (connection acquisition phase)
 */
const transaction = async (fn) => {
  let connection;
  let connectionAcquired = false;
  
  try {
    // Acquire connection with retry
    connection = await executeWithRetry(async () => {
      try {
        const conn = await pool.getConnection();
        connectionAcquired = true;
        return conn;
      } catch (error) {
        if (isPoolExhaustionError(error)) {
          const poolStats = {
            total: pool.pool?._allConnections?.length || 0,
            free: pool.pool?._freeConnections?.length || 0,
            queued: pool.pool?._connectionQueue?.length || 0,
          };
          
          error.message = `Failed to acquire connection for transaction. ` +
            `Pool stats: ${poolStats.total} total, ${poolStats.free} free, ${poolStats.queued} queued. ` +
            `Original error: ${error.message}`;
        }
        throw error;
      }
    });
    
    // Begin transaction
    await connection.beginTransaction();
    
    // Execute transaction function
    const result = await fn(connection);
    
    // Commit transaction
    await connection.commit();
    return result;
  } catch (err) {
    // Rollback only if transaction was started
    if (connection && connectionAcquired) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error during transaction rollback:', rollbackError.message);
      }
    }
    throw err;
  } finally {
    // Always release connection
    if (connection && connectionAcquired) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError.message);
      }
    }
  }
};

module.exports = { query, transaction };