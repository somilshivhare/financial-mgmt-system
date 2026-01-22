/**
 * PM2 Ecosystem Configuration
 * 
 * This file configures PM2 to manage the backend server process.
 * 
 * Usage (run from project root):
 *   cd /var/www/nbaurum
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

const path = require('path');

module.exports = {
  apps: [
    {
      name: 'server',
      script: path.join(__dirname, 'server', 'index.js'),
      cwd: path.join(__dirname, 'server'),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      // Logging
      error_file: path.join(__dirname, 'logs', 'server-error.log'),
      out_file: path.join(__dirname, 'logs', 'server-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Advanced settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Environment variables (can be overridden by .env file)
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};

