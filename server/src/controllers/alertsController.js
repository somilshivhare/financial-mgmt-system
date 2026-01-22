const { apiSuccess } = require('../utils/apiResponse');
const alertsService = require('../services/alertsService');

const listAlerts = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      alertType = '',
      status = '',
      severity = '',
      startDate = '',
      endDate = '',
      unreadOnly = false,
    } = req.query;

    const alerts = await alertsService.listAlerts(req.user.id, {
      page,
      pageSize,
      search,
      alertType,
      status,
      severity,
      startDate,
      endDate,
      unreadOnly: unreadOnly === 'true' || unreadOnly === true,
    });
    res.json(apiSuccess(alerts));
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await alertsService.getUnreadCount(req.user.id);
    res.json(apiSuccess({ count }));
  } catch (err) {
    next(err);
  }
};

const getAlertById = async (req, res, next) => {
  try {
    const alert = await alertsService.getAlertById(req.params.id, req.user.id);
    if (!alert) {
      return res.status(404).json(apiSuccess(null, 'Alert not found'));
    }
    res.json(apiSuccess(alert));
  } catch (err) {
    next(err);
  }
};

const createAlert = async (req, res, next) => {
  try {
    const alert = await alertsService.createAlert(req.body, req.user.id);
    res.status(201).json(apiSuccess(alert, 'Alert created'));
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const alert = await alertsService.markAsRead(req.params.id, req.user.id);
    if (!alert) {
      return res.status(404).json(apiSuccess(null, 'Alert not found'));
    }
    res.json(apiSuccess(alert, 'Alert marked as read'));
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await alertsService.markAllAsRead(req.user.id);
    res.json(apiSuccess(result, 'All alerts marked as read'));
  } catch (err) {
    next(err);
  }
};

const dismissAlert = async (req, res, next) => {
  try {
    const alert = await alertsService.dismissAlert(req.params.id, req.user.id);
    if (!alert) {
      return res.status(404).json(apiSuccess(null, 'Alert not found'));
    }
    res.json(apiSuccess(alert, 'Alert dismissed'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listAlerts,
  getUnreadCount,
  getAlertById,
  createAlert,
  markAsRead,
  markAllAsRead,
  dismissAlert,
};
