const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const { env } = require('./config/env');
const v1Routes = require('./routes/v1');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

// Trust proxy for accurate IP addresses behind reverse proxies
// This enables req.ip to work correctly with X-Forwarded-For headers
app.set('trust proxy', true);

app.use(helmet());

// CORS configuration - restrict to allowed origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, allow localhost origins
    if (env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    // Check against allowed origins list
    if (env.ALLOWED_ORIGINS.length === 0) {
      // If no origins configured in production, deny all
      if (env.NODE_ENV === 'production') {
        return callback(new Error('CORS: No allowed origins configured'));
      }
      return callback(null, true);
    }
    
    if (env.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parsing middleware - must be before routes
// Add error handler for malformed JSON
app.use(express.json({
  limit: '10mb',
  strict: true, // Only parse arrays and objects
  verify: (req, res, buf) => {
    // Store raw body for potential signature verification
    req.rawBody = buf;
  }
}));

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      code: 'ERR_INVALID_JSON',
      message: 'Invalid JSON in request body',
    });
  }
  next(err);
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting - enabled for production security
const { generalLimiter } = require('./middleware/rateLimit');
app.use(generalLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoints (before API routes, bypass rate limiting)
const healthRoutes = require('./routes/health');
app.use('/health', healthRoutes);

app.use('/api/v1', v1Routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;