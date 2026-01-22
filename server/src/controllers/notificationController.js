const { apiSuccess, apiError } = require('../utils/apiResponse');
const notificationService = require('../services/notificationService');
const websocketService = require('../services/websocketService');

/**
 * List notifications for authenticated user
 */
const listNotifications = async (req, res, next) => {
  try {
    const { status, type, limit = 50, offset = 0, unreadOnly } = req.query;
    const result = await notificationService.listNotifications(req.user.id, {
      status,
      type,
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
    });
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json(apiSuccess({ count }));
  } catch (err) {
    next(err);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    res.json(apiSuccess(notification, 'Notification marked as read'));
  } catch (err) {
    next(err);
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(apiSuccess(result, 'All notifications marked as read'));
  } catch (err) {
    next(err);
  }
};

/**
 * Dismiss notification
 */
const dismissNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.dismissNotification(req.params.id, req.user.id);
    res.json(apiSuccess(notification, 'Notification dismissed'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get notification preferences
 */
const getPreferences = async (req, res, next) => {
  try {
    // Initialize preferences if they don't exist
    await notificationService.initializeUserPreferences(req.user.id);
    const preferences = await notificationService.getNotificationPreferences(req.user.id);
    res.json(apiSuccess(preferences));
  } catch (err) {
    next(err);
  }
};

/**
 * Update notification preference
 */
const updatePreference = async (req, res, next) => {
  try {
    const { notificationType, enabled, emailEnabled } = req.body;
    if (!notificationType) {
      return res.status(400).json(apiError('notificationType is required'));
    }
    const preference = await notificationService.updateNotificationPreference(
      req.user.id,
      notificationType,
      { enabled: enabled !== false, emailEnabled: emailEnabled === true }
    );
    res.json(apiSuccess(preference, 'Preference updated'));
  } catch (err) {
    next(err);
  }
};

/**
 * Create notification (admin only)
 */
const createNotification = async (req, res, next) => {
  try {
    const { userId, roleId, type, message, referenceType, referenceId, priority, linkUrl, metadata } = req.body;
    
    if (!type || !message) {
      return res.status(400).json(apiError('type and message are required'));
    }
    
    const notification = await notificationService.createNotification({
      userId,
      roleId,
      type,
      message,
      referenceType,
      referenceId,
      priority,
      linkUrl,
      metadata,
      createdBy: req.user.id,
    });
    
    // Send via WebSocket if user is connected
    if (userId) {
      websocketService.sendNotificationToUser(userId, notification);
    } else if (roleId) {
      websocketService.sendNotificationToRole(roleId, notification);
    }
    
    res.status(201).json(apiSuccess(notification, 'Notification created'));
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

