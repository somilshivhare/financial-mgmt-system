/**
 * Settings Helper Module
 * Provides easy access to settings across the application
 */

const settingsService = require('../services/settingsService');

let systemSettingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 300000; // 5 minutes

/**
 * Get system settings (cached for performance)
 * Use this in other modules to access settings
 */
const getSystemSettings = async (forceRefresh = false) => {
  const now = Date.now();
  
  if (!forceRefresh && systemSettingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    return systemSettingsCache;
  }
  
  try {
    const settings = await settingsService.getSystemSettings();
    systemSettingsCache = settings;
    cacheTimestamp = now;
    return settings;
  } catch (err) {
    console.warn('[Settings Helper] Failed to get system settings:', err.message);
    // Return empty object if settings fail to load
    return {};
  }
};

/**
 * Get a specific setting category
 */
const getSetting = async (key) => {
  const settings = await getSystemSettings();
  return settings[key] || null;
};

/**
 * Get company name
 */
const getCompanyName = async () => {
  const general = await getSetting('general');
  return general?.companyName || 'NB Aurum';
};

/**
 * Get currency
 */
const getCurrency = async () => {
  const general = await getSetting('general');
  return general?.currency || 'INR';
};

/**
 * Get financial year
 */
const getFinancialYear = async () => {
  const general = await getSetting('general');
  return general?.financialYear || '2024-2025';
};

/**
 * Get invoice numbering format
 */
const getInvoiceNumberingFormat = async () => {
  const invoice = await getSetting('invoice');
  return invoice?.numberingFormat || 'INV-{YYYY}-{SEQ}';
};

/**
 * Get default tax percent
 */
const getDefaultTaxPercent = async () => {
  const invoice = await getSetting('invoice');
  return invoice?.taxDefaultPercent || 18;
};

/**
 * Get default payment terms
 */
const getDefaultPaymentTerms = async () => {
  const invoice = await getSetting('invoice');
  return invoice?.paymentTermDefault || 'Net 30';
};

/**
 * Invalidate cache (call after settings update)
 */
const invalidateCache = () => {
  systemSettingsCache = null;
  cacheTimestamp = null;
  // Also invalidate service cache
  settingsService.invalidateCache();
};

module.exports = {
  getSystemSettings,
  getSetting,
  getCompanyName,
  getCurrency,
  getFinancialYear,
  getInvoiceNumberingFormat,
  getDefaultTaxPercent,
  getDefaultPaymentTerms,
  invalidateCache,
};

