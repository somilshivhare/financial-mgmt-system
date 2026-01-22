const http = require('http');
const app = require('./src/app');
const { env } = require('./src/config/env');
const { initializeWebSocket } = require('./src/services/websocketService');
const { initializeWithRetry, getHealthStatus } = require('./src/db/pool');

const port = env.PORT || 4000;

/**
 * Start the server with database connection verification
 */
const startServer = async () => {
  try {
    // Attempt to initialize database connection with retry
    console.log('Initializing database connection...');
    const dbConnected = await initializeWithRetry();
    
    if (!dbConnected) {
      const healthStatus = getHealthStatus();
      console.warn(
        '⚠ Warning: Database connection could not be established during startup. ' +
        'The server will start, but database operations may fail. ' +
        `Last error: ${healthStatus.lastError?.message || 'Unknown'}`
      );
      console.warn(
        'The application will continue to retry database connections. ' +
        'Check the /health endpoint for current database status.'
      );
    }
    
    // Create HTTP server
    const httpServer = http.createServer(app);
    
    // Initialize WebSocket server
    initializeWebSocket(httpServer);
    
    // Start listening
    httpServer.listen(port, () => {
      console.log(`✓ API listening on port ${port}`);
      console.log(`✓ WebSocket server initialized`);
      console.log(`✓ Environment: ${env.NODE_ENV}`);
      
      if (dbConnected) {
        console.log('✓ Server ready and database connected');
      } else {
        console.log('⚠ Server ready but database connection pending');
      }
    });
    
    // Handle server errors gracefully
    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`✗ Port ${port} is already in use`);
        process.exit(1);
      } else {
        console.error('✗ Server error:', error.message);
        process.exit(1);
      }
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      httpServer.close(() => {
        console.log('✓ HTTP server closed');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('✗ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
