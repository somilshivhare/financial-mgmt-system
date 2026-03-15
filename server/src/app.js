const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const { env } = require('./config/env');
const v1Routes = require('./routes/v1');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

app.set('trust proxy', true);

app.use(helmet());
app.use(cookieParser());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    
    if (env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    if (env.ALLOWED_ORIGINS.length === 0) {
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

app.use(express.json({
  limit: '50mb',
  strict: true, // Only parse arrays and objects
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      code: 'ERR_INVALID_JSON',
      message: 'Invalid JSON in request body',
    });
  }
  
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      code: 'ERR_PAYLOAD_TOO_LARGE',
      message: 'The request payload is too large. Please reduce the size of attachments or logos.',
    });
  }
  
  next(err);
});

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const { generalLimiter } = require('./middleware/rateLimit');
app.use(generalLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const healthRoutes = require('./routes/health');
app.use('/health', healthRoutes);

app.use('/api/v1', v1Routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;