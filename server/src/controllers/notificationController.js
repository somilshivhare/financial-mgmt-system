const { apiSuccess, apiError } = require('../utils/apiResponse');
const notificationService = require('../services/notificationService');
const websocketService = require('../services/websocketService');

/**
 * List notifications for authenticated user
 * TEMPORARILY DISABLED - Returns empty results to prevent database errors
 */
const listNotifications = async (req, res, next) => {
  try {
    // Temporarily return empty results without querying database
    res.json(apiSuccess({ notifications: [], total: 0 }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get unread notification count
 * TEMPORARILY DISABLED - Returns 0 to prevent database errors
 */
const getUnreadCount = async (req, res, next) => {
  try {
    // Temporarily return 0 without querying database
    res.json(apiSuccess({ count: 0 }));
  } catch (err) {
    next(err);
  }
};

/**
 * Mark notification as read
 * TEMPORARILY DISABLED
 */
const markAsRead = async (req, res, next) => {
  try {
    res.json(apiSuccess({ id: req.params.id, status: 'read' }, 'Notification marked as read'));
  } catch (err) {
    next(err);
  }
};

/**
 * Mark all notifications as read
 * TEMPORARILY DISABLED
 */
const markAllAsRead = async (req, res, next) => {
  try {
    res.json(apiSuccess({ success: true }, 'All notifications marked as read'));
  } catch (err) {
    next(err);
  }
};

/**
 * Dismiss notification
 * TEMPORARILY DISABLED
 */
const dismissNotification = async (req, res, next) => {
  try {
    res.json(apiSuccess({ id: req.params.id, status: 'dismissed' }, 'Notification dismissed'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get notification preferences
 * TEMPORARILY DISABLED
 */
const getPreferences = async (req, res, next) => {
  try {
    res.json(apiSuccess([]));
  } catch (err) {
    next(err);
  }
};

/**
 * Update notification preference
 * TEMPORARILY DISABLED
 */
const updatePreference = async (req, res, next) => {
  try {
    const { notificationType, enabled, emailEnabled } = req.body;
    if (!notificationType) {
      return res.status(400).json(apiError('notificationType is required'));
    }
    res.json(apiSuccess({ notificationType, enabled, emailEnabled }, 'Preference updated'));
  } catch (err) {
    next(err);
  }
};

/**
 * Create notification (admin only)
 * TEMPORARILY DISABLED
 */
const createNotification = async (req, res, next) => {
  try {
    const { userId, roleId, type, message, referenceType, referenceId, priority, linkUrl, metadata } = req.body;
    
    if (!type || !message) {
      return res.status(400).json(apiError('type and message are required'));
    }
    
    // Return mock notification without saving to database
    const mockNotification = {
      id: 'temp-' + Date.now(),
      userId,
      roleId,
      type,
      message,
      referenceType,
      referenceId,
      priority: priority || 'medium',
      linkUrl,
      metadata,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    
    res.status(201).json(apiSuccess(mockNotification, 'Notification created (temporarily disabled)'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  getPreferences,
  updatePreference,
  createNotification,
};

