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
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment ? message : 'An error occurred. Please try again.';
  
  res.status(status).json(apiError(errorMessage, code, isDevelopment ? { stack: err.stack } : null));
};

module.exports = { notFound, errorHandler };