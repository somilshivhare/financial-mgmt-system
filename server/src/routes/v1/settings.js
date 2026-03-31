const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { settingsUpdateSchema, resetSettingsSchema } = require('../../validators/settingsValidators');
const {
  getSettings,
  getSystemSettings,
  updateSettings,
  resetSettings,
  getAuditLog,
  checkFinancialYearChange,
  resetSystemWithBackup,
} = require('../../controllers/settingsController');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), getSettings);

router.get('/system', requireAuth, getSystemSettings);

router.get('/check-financial-year', requireAuth, requireRole('admin'), checkFinancialYearChange);

router.put('/', requireAuth, requireRole('admin'), validate(settingsUpdateSchema), updateSettings);
router.patch('/', requireAuth, requireRole('admin'), validate(settingsUpdateSchema), updateSettings);

router.post('/reset', requireAuth, requireRole('admin'), validate(resetSettingsSchema), resetSettings);
router.post('/reset-system', requireAuth, requireRole('admin'), resetSystemWithBackup);

router.get('/audit', requireAuth, requireRole('admin'), getAuditLog);

module.exports = router;
