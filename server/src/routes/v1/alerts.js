const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { alertSchema, alertStatusSchema } = require('../../validators/alertsValidators');
const { listAlerts, createAlert, updateAlertStatus } = require('../../controllers/alertsController');

const router = express.Router();

router.get('/', requireAuth, listAlerts);
router.post('/', requireAuth, requireRole('admin'), validate(alertSchema), createAlert);
router.patch('/:id/status', requireAuth, validate(alertStatusSchema), updateAlertStatus);

module.exports = router;

