const { apiError } = require('../utils/apiResponse');

const notFound = (req, res, _next) => {
  console.error(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json(apiError(`Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  console.error('[Error Handler]', err);
  
  // Handle rate limit errors
  if (err.status === 429) {
    return res.status(429).json(apiError(
      err.message || 'Too many requests. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      { retryAfter: err.retryAfter }
    ));
  }
  
  // Handle validation errors
  if (err.name === 'ZodError' || err.code === 'ERR_VALIDATION') {
    return res.status(400).json(apiError(
      err.message || 'Validation error',
      'ERR_VALIDATION',
      err.errors || err.issues
    ));
  }
  
  // Handle database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json(apiError(
      'Duplicate entry. This record already exists.',
      'ERR_DUPLICATE',
      { field: err.field || 'unknown' }
    ));
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    const sqlMsg = (err.sqlMessage || '').toLowerCase();
    if (sqlMsg.includes('fk_inv_customer') || sqlMsg.includes('customer_id')) {
      return res.status(400).json(apiError(
        'The selected customer is invalid or was not found. Please choose a valid Key ID (PO) linked to a customer and try again.',
        'ERR_CUSTOMER_NOT_FOUND'
      ));
    }
    if (sqlMsg.includes('fk_inv_po')) {
      return res.status(400).json(apiError(
        'The selected Purchase Order was not found. Please choose a valid Key ID (PO) and try again.',
        'ERR_PO_NOT_FOUND'
      ));
    }
    if (sqlMsg.includes('fk_inv_created_by')) {
      return res.status(401).json(apiError(
        'User not found. Please log out and log in again.',
        'ERR_USER_NOT_FOUND'
      ));
    }
    return res.status(400).json(apiError(
      'A referenced record was not found. Please refresh the page, or log out and log in again.',
      'ERR_REFERENCE_NOT_FOUND'
    ));
  }

  if (err.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(500).json(apiError(
      'Database schema is outdated. Please run migrations.',
      'ERR_DATABASE_SCHEMA',
      process.env.NODE_ENV === 'development' ? { details: err.message } : null
    ));
  }
  
  // Handle MySQL parameter errors
  if (err.code === 'ER_WRONG_ARGUMENTS' || err.message?.includes('mysqld_stmt_execute')) {
    console.error('[Database] Parameter mismatch error:', {
      code: err.code,
      message: err.message,
      sql: err.sql,
      sqlState: err.sqlState,
    });
    return res.status(500).json(apiError(
      'Database query error. Please contact support if this persists.',
      'ERR_DATABASE_QUERY',
      process.env.NODE_ENV === 'development' ? { details: err.message } : null
    ));
  }
  
  // Handle other MySQL errors
  if (err.code && err.code.startsWith('ER_')) {
    console.error('[Database] MySQL error:', {
      code: err.code,
      message: err.message,
      sql: err.sql,
    });
    return res.status(500).json(apiError(
      'Database error occurred. Please try again.',
      'ERR_DATABASE',
      process.env.NODE_ENV === 'development' ? { details: err.message } : null
    ));
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json(apiError(
      'Invalid or expired token',
      'ERR_INVALID_TOKEN'
    ));
  }
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'ERR_INTERNAL';
  
  // Don't expose internal error details in production unless it's a known error code
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isStaging = process.env.NODE_ENV === 'staging';
  const isKnownError = [
    'ERR_VALIDATION',
    'ERR_DUPLICATE',
    'ERR_DATABASE_SCHEMA',
    'ERR_INVALID_BODY',
    'ERR_MISSING_TYPE',
    'ERR_UNAUTHORIZED',
    'ERR_INVALID_COMPANY',
    'ERR_MISSING_COMPANY',
    'ERR_REFERENCE_NOT_FOUND',
  ].includes(code);

  const errorMessage = (isDevelopment || isStaging || isKnownError) ? message : 'An error occurred. Please try again.';
  
  // Ensure we always return valid JSON
  try {
    if (res.headersSent) {
      console.error('[Error Handler] Headers already sent, cannot send error JSON');
      return;
    }
    
    const errorResponse = apiError(errorMessage, code, (isDevelopment || isStaging) ? { stack: err.stack, details: err.details || null } : null);
    res.status(status).json(errorResponse);
  } catch (jsonError) {
    // Fallback if JSON serialization fails
    console.error('[Error Handler] Failed to send JSON response:', jsonError);
    
    // Make sure response hasn't been sent already
    if (res.headersSent) {
      return;
    }
    
    try {
      res.status(status).setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'An error occurred. Please try again.',
      }));
    } catch (finalError) {
      // Last resort - try to send plain text
      console.error('[Error Handler] Complete failure to send response:', finalError);
      if (!res.headersSent) {
        res.status(500).end('Internal Server Error');
      }
    }
  }
};

module.exports = { notFound, errorHandler };