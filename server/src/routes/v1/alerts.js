const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { validate } = require('../../middleware/validate');
const { alertSchema, alertStatusSchema } = require('../../validators/alertsValidators');
const {
  listAlerts,
  getUnreadCount,
  getAlertById,
  createAlert,
  markAsRead,
  markAllAsRead,
  dismissAlert,
} = require('../../controllers/alertsController');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get unread count
router.get('/unread-count', getUnreadCount);

// List alerts with pagination, search, and filters
router.get('/', listAlerts);

// Get alert by ID
router.get('/:id', getAlertById);

// Create alert (admin only, or for system-generated alerts)
router.post('/', validate(alertSchema), createAlert);

// Mark alert as read
router.patch('/:id/read', markAsRead);

// Mark all alerts as read
router.patch('/read-all', markAllAsRead);

// Dismiss alert
router.patch('/:id/dismiss', dismissAlert);

module.exports = router;
