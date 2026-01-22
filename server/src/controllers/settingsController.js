const { apiSuccess, apiError } = require('../utils/apiResponse');
const settingsService = require('../services/settingsService');
const { settingsUpdateSchema, resetSettingsSchema } = require('../validators/settingsValidators');

/**
 * Get all settings
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getAllSettings();
    res.json(apiSuccess(settings));
  } catch (err) {
    next(err);
  }
};

/**
 * Get system settings (without metadata, for internal use)
 */
const getSystemSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSystemSettings();
    res.json(apiSuccess(settings));
  } catch (err) {
    next(err);
  }
};

/**
 * Update settings
 */
const updateSettings = async (req, res, next) => {
  try {
    const validated = settingsUpdateSchema.parse(req.body);
    const changeReason = req.body._changeReason || null;
    
    const results = await settingsService.updateSettings(validated, req.user.id, changeReason);
    res.json(apiSuccess(results, 'Settings updated successfully'));
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json(apiError('Validation failed', 'VALIDATION_ERROR', err.errors));
    }
    if (err.message === 'SETTING_NOT_FOUND') {
      return res.status(404).json(apiError('Setting not found', 'SETTING_NOT_FOUND'));
    }
    if (err.message.startsWith('SETTING_LOCKED')) {
      return res.status(403).json(apiError(err.message.replace('SETTING_LOCKED: ', ''), 'SETTING_LOCKED'));
    }
    if (err.message.includes('Cannot change financial year')) {
      return res.status(400).json(apiError(err.message, 'FINANCIAL_YEAR_LOCKED'));
    }
    next(err);
  }
};

/**
 * Reset settings to defaults
 */
const resetSettings = async (req, res, next) => {
  try {
    const validated = resetSettingsSchema.parse(req.body);
    const results = await settingsService.resetToDefaults(req.user.id, validated.keys);
    res.json(apiSuccess(results, 'Settings reset to defaults'));
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json(apiError('Validation failed', 'VALIDATION_ERROR', err.errors));
    }
    next(err);
  }
};

/**
 * Get settings audit log
 */
const getAuditLog = async (req, res, next) => {
  try {
    const { key, limit = 50 } = req.query;
    const logs = await settingsService.getAuditLog(key, parseInt(limit));
    res.json(apiSuccess(logs));
  } catch (err) {
    next(err);
  }
};

/**
 * Check if financial year can be changed
 */
const checkFinancialYearChange = async (req, res, next) => {
  try {
    const { financialYear } = req.query;
    if (!financialYear) {
      return res.status(400).json(apiError('financialYear query parameter is required'));
    }
    
    const validation = await settingsService.canChangeFinancialYear(financialYear);
    res.json(apiSuccess(validation));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  getSystemSettings,
  updateSettings,
  resetSettings,
  getAuditLog,
  checkFinancialYearChange,
};
