const express = require('express');
const { getHealthStatus, performHealthCheck } = require('../db/pool');
const { env } = require('../config/env');

const router = express.Router();

/**
 * Comprehensive health check endpoint
 * Returns 200 if API and database are healthy
 * Returns 503 if database is unavailable
 * Includes database connection status, pool stats, and error information
 */
router.get('/', async (_req, res) => {
  try {
    const startTime = Date.now();
    
    // Perform a fresh health check
    const dbHealthy = await performHealthCheck();
    const healthStatus = getHealthStatus();
    const responseTime = Date.now() - startTime;
    
    const response = {
      ok: dbHealthy,
      status: dbHealthy ? 'healthy' : 'unhealthy',
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      database: {
        healthy: dbHealthy,
        lastCheck: healthStatus.lastCheck?.toISOString() || null,
        consecutiveFailures: healthStatus.consecutiveFailures,
        pool: healthStatus.poolStats,
        error: healthStatus.lastError ? {
          code: healthStatus.lastError.code,
          message: healthStatus.lastError.message,
        } : null,
      },
    };
    
    // Return appropriate HTTP status code
    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    // If health check itself fails, return 503
    res.status(503).json({
      ok: false,
      status: 'unhealthy',
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        healthy: false,
        error: {
          message: error.message,
          code: error.code,
        },
      },
    });
  }
});

/**
 * Database-only health check endpoint
 * Returns 200 if database is reachable and responsive
 * Returns 503 if database is unavailable
 * Uses minimal query (SELECT 1) for fast response
 */
router.get('/db', async (_req, res) => {
  try {
    const startTime = Date.now();
    
    // Perform a fresh health check
    const dbHealthy = await performHealthCheck();
    const healthStatus = getHealthStatus();
    const responseTime = Date.now() - startTime;
    
    const response = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      database: dbHealthy ? 'connected' : 'disconnected',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      consecutiveFailures: healthStatus.consecutiveFailures,
      pool: healthStatus.poolStats,
      error: healthStatus.lastError ? {
        code: healthStatus.lastError.code,
        message: healthStatus.lastError.message,
      } : null,
    };
    
    // Return appropriate HTTP status code
    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    // Return 503 Service Unavailable for database failures
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: {
        message: error.message,
        code: error.code,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;

