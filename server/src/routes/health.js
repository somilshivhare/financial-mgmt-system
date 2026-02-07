const express = require('express');
const { getHealthStatus, performHealthCheck } = require('../db/pool');
const { env } = require('../config/env');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const startTime = Date.now();
    
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
    
    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
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

router.get('/db', async (_req, res) => {
  try {
    const startTime = Date.now();
    
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
    
    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
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

