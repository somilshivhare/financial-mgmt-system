const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { runChecks } = require('../../controllers/alertGenerationController');

const router = express.Router();

// Admin only - trigger alert generation checks
router.post('/run-checks', requireAuth, requireRole('admin'), runChecks);

module.exports = router;

