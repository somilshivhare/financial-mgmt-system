
const settingsService = require('../services/settingsService');

let systemSettingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 300000; // 5 minutes

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
    return {};
  }
};

const getSetting = async (key) => {
  const settings = await getSystemSettings();
  return settings[key] || null;
};

const getCompanyName = async () => {
  const general = await getSetting('general');
  return general?.companyName || 'NB Aurum Solutions';
};

const getCurrency = async () => {
  const general = await getSetting('general');
  return general?.currency || 'INR';
};

const getFinancialYear = async () => {
  const general = await getSetting('general');
  return general?.financialYear || '2024-2025';
};

const getInvoiceNumberingFormat = async () => {
  const invoice = await getSetting('invoice');
  return invoice?.numberingFormat || 'INV-{YYYY}-{SEQ}';
};

const getDefaultTaxPercent = async () => {
  const invoice = await getSetting('invoice');
  return invoice?.taxDefaultPercent || 18;
};

const getDefaultPaymentTerms = async () => {
  const invoice = await getSetting('invoice');
  return invoice?.paymentTermDefault || 'Net 30';
};

const invalidateCache = () => {
  systemSettingsCache = null;
  cacheTimestamp = null;
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

