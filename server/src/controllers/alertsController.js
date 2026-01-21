const { apiSuccess } = require('../utils/apiResponse');
const alertsService = require('../services/alertsService');

const listAlerts = async (req, res, next) => {
  try {
    const alerts = await alertsService.listAlerts(req.user.id);
    res.json(apiSuccess(alerts));
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

const updateAlertStatus = async (req, res, next) => {
  try {
    const alert = await alertsService.updateAlertStatus(req.params.id, req.body.status);
    res.json(apiSuccess(alert, 'Alert updated'));
  } catch (err) {
    next(err);
  }
};

module.exports = { listAlerts, createAlert, updateAlertStatus };

