const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  getPreferences,
  updatePreference,
  createNotification,
} = require('../../controllers/notificationController');

const router = express.Router();

// Get notifications
router.get('/', requireAuth, listNotifications);

// Get unread count
router.get('/unread/count', requireAuth, getUnreadCount);

// Get preferences
router.get('/preferences', requireAuth, getPreferences);

// Update preference
router.patch('/preferences', requireAuth, updatePreference);

// Mark as read
router.patch('/:id/read', requireAuth, markAsRead);

// Mark all as read
router.patch('/read/all', requireAuth, markAllAsRead);

// Dismiss notification
router.patch('/:id/dismiss', requireAuth, dismissNotification);

// Create notification (admin only)
router.post('/', requireAuth, requireRole('admin'), createNotification);

module.exports = router;

