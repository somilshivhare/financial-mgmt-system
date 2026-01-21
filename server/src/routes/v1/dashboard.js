const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { getDashboard } = require('../../controllers/dashboardController');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin', 'finance', 'operations', 'sales'), getDashboard);

module.exports = router;