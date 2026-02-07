const { pool, isTransientError, DB_CONNECTION_CONFIG } = require('./pool');

const sanitizeParams = (params) => {
  if (!Array.isArray(params)) {
    return params;
  }
  return params.map(param => {
    if (param === undefined) {
      return null;
    }
    if (Array.isArray(param)) {
      return sanitizeParams(param);
    }
    return param;
  });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const isPoolExhaustionError = (error) => {
  if (!error) return false;
  
  const errorCode = error.code;
  const errorMessage = error.message?.toLowerCase() || '';
  
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

const executeWithRetry = async (executeFn, maxRetries = 3, initialDelay = 100) => {
  let attempt = 0;
  let lastError;
  
  while (attempt <= maxRetries) {
    try {
      return await executeFn();
    } catch (error) {
      lastError = error;
      
      if (!isTransientError(error) && !isPoolExhaustionError(error)) {
        throw error;
      }
      
      if (attempt >= maxRetries) {
        break;
      }
      
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt),
        DB_CONNECTION_CONFIG.MAX_RETRY_DELAY_MS
      );
      
      attempt++;
      
      if (isPoolExhaustionError(error) || process.env.NODE_ENV !== 'production') {
        console.warn(
          `Query retry attempt ${attempt}/${maxRetries} after ${error.code || error.message}. ` +
          `Waiting ${Math.round(delay)}ms...`
        );
      }
      
      await sleep(delay);
    }
  }
  
  throw lastError;
};

const query = async (sql, params = []) => {
  const sanitizedParams = sanitizeParams(params);
  
  return executeWithRetry(async () => {
    try {
      const [rows] = await pool.query(sql, sanitizedParams);
      return rows;
    } catch (error) {
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

const transaction = async (fn) => {
  let connection;
  let connectionAcquired = false;
  
  try {
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
    
    await connection.beginTransaction();
    
    const result = await fn(connection);
    
    await connection.commit();
    return result;
  } catch (err) {
    if (connection && connectionAcquired) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error during transaction rollback:', rollbackError.message);
      }
    }
    throw err;
  } finally {
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