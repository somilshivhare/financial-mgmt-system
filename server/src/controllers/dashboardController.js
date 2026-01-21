const { apiSuccess } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboardService');

const getDashboard = async (_req, res, next) => {
  try {
    const data = await dashboardService.getDashboard();
    res.json(apiSuccess(data));
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };

