const { apiSuccess } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboardService');

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };
    const data = await dashboardService.getDashboard(userId, filters);
    res.json(apiSuccess(data));
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      period: req.query.period || 'monthly',
    };
    const data = await dashboardService.getAnalytics(filters);
    res.json(apiSuccess(data));
  } catch (err) {
    next(err);
  }
};

const getSubscriptionUsage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await dashboardService.getSubscriptionUsage(userId);
    res.json(apiSuccess(data));
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  getDashboard,
  getAnalytics,
  getSubscriptionUsage,
};

