const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { getDashboard, getAnalytics, getSubscriptionUsage } = require('../../controllers/dashboardController');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin', 'user'));

router.get('/', getDashboard);

router.get('/analytics', getAnalytics);

router.get('/subscription-usage', getSubscriptionUsage);

module.exports = router;