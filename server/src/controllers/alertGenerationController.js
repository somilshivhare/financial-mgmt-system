const { apiSuccess } = require('../utils/apiResponse');
const alertGenerationService = require('../services/alertGenerationService');

const runChecks = async (req, res, next) => {
  try {
    const results = await alertGenerationService.runAllChecks();
    res.json(apiSuccess(results, 'Alert generation checks completed'));
  } catch (err) {
    next(err);
  }
};

module.exports = { runChecks };

