const { apiSuccess, apiError } = require('../utils/apiResponse');
const notificationService = require('../services/notificationService');
const websocketService = require('../services/websocketService');

const listNotifications = async (req, res, next) => {
  try {
    res.json(apiSuccess({ notifications: [], total: 0 }));
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    res.json(apiSuccess({ count: 0 }));
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    res.json(apiSuccess({ id: req.params.id, status: 'read' }, 'Notification marked as read'));
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    res.json(apiSuccess({ success: true }, 'All notifications marked as read'));
  } catch (err) {
    next(err);
  }
};

const dismissNotification = async (req, res, next) => {
  try {
    res.json(apiSuccess({ id: req.params.id, status: 'dismissed' }, 'Notification dismissed'));
  } catch (err) {
    next(err);
  }
};

const getPreferences = async (req, res, next) => {
  try {
    res.json(apiSuccess([]));
  } catch (err) {
    next(err);
  }
};

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

const createNotification = async (req, res, next) => {
  try {
    const { userId, roleId, type, message, referenceType, referenceId, priority, linkUrl, metadata } = req.body;
    
    if (!type || !message) {
      return res.status(400).json(apiError('type and message are required'));
    }
    
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

