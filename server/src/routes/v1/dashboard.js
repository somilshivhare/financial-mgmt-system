const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { getDashboard, getAnalytics, getSubscriptionUsage } = require('../../controllers/dashboardController');

const router = express.Router();

// All dashboard routes require authentication and appropriate role
router.use(requireAuth);
router.use(requireRole('admin', 'user'));

// Main dashboard endpoint
router.get('/', getDashboard);

// Analytics endpoint for charts
router.get('/analytics', getAnalytics);

// Subscription and storage usage
router.get('/subscription-usage', getSubscriptionUsage);

module.exports = router;