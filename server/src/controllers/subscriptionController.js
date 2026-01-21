const { apiSuccess } = require('../utils/apiResponse');
const subscriptionService = require('../services/subscriptionService');

const getSubscription = async (_req, res, next) => {
  try {
    const sub = await subscriptionService.getSubscription();
    res.json(apiSuccess(sub));
  } catch (err) {
    next(err);
  }
};

const upsertSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.upsertSubscription(req.body);
    res.status(201).json(apiSuccess(sub, 'Subscription saved'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getSubscription, upsertSubscription };

