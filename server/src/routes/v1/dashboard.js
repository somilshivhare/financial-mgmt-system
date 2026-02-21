const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { getDashboard, getAnalytics, getSubscriptionUsage } = require('../../controllers/dashboardController');

const router = express.Router();

// Every authenticated user gets their own dashboard (data filtered by req.user.id in controller)
router.use(requireAuth);

router.get('/', getDashboard);

router.get('/analytics', getAnalytics);

router.get('/subscription-usage', getSubscriptionUsage);

module.exports = router;