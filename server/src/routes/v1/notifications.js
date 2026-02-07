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

router.get('/', requireAuth, listNotifications);

router.get('/unread/count', requireAuth, getUnreadCount);

router.get('/preferences', requireAuth, getPreferences);

router.patch('/preferences', requireAuth, updatePreference);

router.patch('/:id/read', requireAuth, markAsRead);

router.patch('/read/all', requireAuth, markAllAsRead);

router.patch('/:id/dismiss', requireAuth, dismissNotification);

router.post('/', requireAuth, requireRole('admin'), createNotification);

module.exports = router;

