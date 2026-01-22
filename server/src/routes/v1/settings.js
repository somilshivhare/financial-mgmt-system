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
} = require('../../controllers/settingsController');

const router = express.Router();

// Get all settings (admin only)
router.get('/', requireAuth, requireRole('admin'), getSettings);

// Get system settings (for internal use, no metadata)
router.get('/system', requireAuth, getSystemSettings);

// Check if financial year can be changed
router.get('/check-financial-year', requireAuth, requireRole('admin'), checkFinancialYearChange);

// Update settings (admin only)
router.put('/', requireAuth, requireRole('admin'), validate(settingsUpdateSchema), updateSettings);
router.patch('/', requireAuth, requireRole('admin'), validate(settingsUpdateSchema), updateSettings);

// Reset settings to defaults (admin only)
router.post('/reset', requireAuth, requireRole('admin'), validate(resetSettingsSchema), resetSettings);

// Get audit log (admin only)
router.get('/audit', requireAuth, requireRole('admin'), getAuditLog);

module.exports = router;
