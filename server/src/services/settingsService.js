const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

const parseSettingValue = (val) => {
  if (val == null) return {};
  if (typeof val === 'object') return val;
  if (typeof val !== 'string') return {};
  try {
    return JSON.parse(val);
  } catch (e) {
    return {};
  }
};

let settingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000; // 1 minute

const getAllSettings = async (useCache = true) => {
  const now = Date.now();
  
  if (useCache && settingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    return settingsCache;
  }
  
  try {
    const settings = await query(
      'SELECT setting_key, setting_value, setting_type, is_locked, lock_reason, updated_at, created_at FROM settings ORDER BY setting_key'
    );
    
    const settingsObj = {};
    if (settings && Array.isArray(settings)) {
      settings.forEach(setting => {
        try {
          settingsObj[setting.setting_key] = {
            ...parseSettingValue(setting.setting_value),
            _meta: {
              type: setting.setting_type,
              isLocked: setting.is_locked,
              lockReason: setting.lock_reason,
              updatedAt: setting.updated_at,
              createdAt: setting.created_at,
            }
          };
        } catch (parseErr) {
          console.warn(`[Settings] Failed to parse setting ${setting.setting_key}:`, parseErr.message);
        }
      });
    }
    
    settingsCache = settingsObj;
    cacheTimestamp = now;
    
    return settingsObj;
  } catch (err) {
    console.warn('[Settings] Failed to load settings, returning empty object:', err.message);
    return {};
  }
};

const getSetting = async (key) => {
  const [setting] = await query(
    'SELECT setting_key, setting_value, setting_type, is_locked, lock_reason, updated_at, created_at FROM settings WHERE setting_key = ?',
    [key]
  );
  
  if (!setting) return null;
  
  return {
    ...parseSettingValue(setting.setting_value),
    _meta: {
      type: setting.setting_type,
      isLocked: setting.is_locked,
      lockReason: setting.lock_reason,
      updatedAt: setting.updated_at,
      createdAt: setting.created_at,
    }
  };
};

const canChangeFinancialYear = async (newFinancialYear) => {
  try {
    const invoiceRows = await query(
      'SELECT COUNT(*) as count FROM invoices WHERE YEAR(created_at) IN (?, ?)',
      [newFinancialYear.split('-')[0], newFinancialYear.split('-')[1]]
    );
    const invoiceCount = (invoiceRows && invoiceRows[0]) ? Number(invoiceRows[0].count) : 0;

    const paymentRows = await query('SELECT COUNT(*) as count FROM payments');
    const paymentCount = (paymentRows && paymentRows[0]) ? Number(paymentRows[0].count) : 0;

    if (invoiceCount > 0 || paymentCount > 0) {
      const currentFY = await getSetting('general');
      if (currentFY && currentFY.financialYear !== newFinancialYear) {
        return {
          allowed: false,
          reason: 'Cannot change financial year: Transactions already exist in the system. Financial year changes are only allowed before any transactions are recorded.',
        };
      }
    }

    return { allowed: true };
  } catch (err) {
    console.warn('[Settings] canChangeFinancialYear check failed:', err.message);
    return { allowed: true };
  }
};

const updateSetting = async (key, value, userId, changeReason = null) => {
  return transaction(async (conn) => {
    const [oldSetting] = await conn.execute(
      'SELECT setting_value, setting_type, is_locked FROM settings WHERE setting_key = ?',
      [key]
    );
    
    if (!oldSetting || oldSetting.length === 0) {
      throw new Error('SETTING_NOT_FOUND');
    }
    
    const oldValue = parseSettingValue(oldSetting[0].setting_value);
    
    if (key === 'general' && value.financialYear && oldValue.financialYear !== value.financialYear) {
      const validation = await canChangeFinancialYear(value.financialYear);
      if (!validation.allowed) {
        throw new Error(validation.reason);
      }
    }
    
    if (oldSetting[0].is_locked) {
      throw new Error(`SETTING_LOCKED: ${oldSetting[0].lock_reason || 'This setting cannot be changed'}`);
    }
    
    await conn.execute(
      'UPDATE settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
      [JSON.stringify(value), userId, key]
    );
    
    const auditId = uuidv4();
    await conn.execute(
      `INSERT INTO settings_audit_log (id, setting_key, old_value, new_value, changed_by, change_reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [auditId, key, JSON.stringify(oldValue), JSON.stringify(value), userId, changeReason]
    );
    
  settingsCache = null;
  cacheTimestamp = null;
  
    const [updated] = await conn.execute(
      'SELECT setting_key, setting_value, setting_type, updated_at FROM settings WHERE setting_key = ?',
      [key]
    );
    
    return {
      key: updated[0].setting_key,
      value: parseSettingValue(updated[0].setting_value),
      type: updated[0].setting_type,
      updatedAt: updated[0].updated_at,
    };
  });
};

const updateSettings = async (settingsObj, userId, changeReason = null) => {
  const results = {};
  
  for (const [key, value] of Object.entries(settingsObj)) {
    const result = await updateSetting(key, value, userId, changeReason);
    results[key] = result;
  }
  
  return results;
};

const resetToDefaults = async (userId, settingKeys = null) => {
  const defaults = {
    general: {
      companyName: 'NB Aurum Solutions',
      companyEmail: 'finance@nbaurumsolutions.com',
      companyPhone: '+91 99674 50118',
      companyAddress: 'Lower Ground Floor, LGF-17, Krishna Apra D Mall, Shakti Khand-2, Indirapuram, Ghaziabad District, Uttar Pradesh – 201014, India',
      financialYear: '2024-2025',
      currency: 'INR',
    },
    invoice: {
      numberingFormat: 'INV-{YYYY}-{SEQ}',
      taxDefaultPercent: 18,
      paymentTermDefault: 'Net 30',
    },
    notifications: {
      emailNotifications: true,
      systemAlerts: true,
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeoutMinutes: 30,
    },
    access: {
      roles: [
        { name: 'Administrator', permissions: ['All access'] },
        { name: 'Manager', permissions: ['Invoices: Manage', 'Collections: Manage', 'Reports: View'] },
        { name: 'User', permissions: ['Invoices: View', 'Payments: View'] },
        { name: 'Accountant', permissions: ['Invoices: Manage', 'Payments: Manage'] },
      ],
    },
  };
  
  const keysToReset = settingKeys || Object.keys(defaults);
  const settingsToReset = {};
  
  keysToReset.forEach(key => {
    if (defaults[key]) {
      settingsToReset[key] = defaults[key];
    }
  });
  
  return updateSettings(settingsToReset, userId, 'Reset to defaults');
};

const lockSetting = async (key, reason, userId) => {
  await query(
    'UPDATE settings SET is_locked = TRUE, lock_reason = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
    [reason, userId, key]
  );
  
  settingsCache = null;
  cacheTimestamp = null;
};

const unlockSetting = async (key, userId) => {
  await query(
    'UPDATE settings SET is_locked = FALSE, lock_reason = NULL, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
    [userId, key]
  );
  
  settingsCache = null;
  cacheTimestamp = null;
};

const getAuditLog = async (key = null, limit = 50) => {
  const where = key ? 'WHERE setting_key = ?' : '';
  const params = key ? [key] : [];
  
  const logs = await query(
    `SELECT id, setting_key, old_value, new_value, changed_by, change_reason, created_at
     FROM settings_audit_log
     ${where}
     ORDER BY created_at DESC
     LIMIT ?`,
    [...params, limit]
  );
  
  return logs.map(log => ({
    id: log.id,
    settingKey: log.setting_key,
    oldValue: parseSettingValue(log.old_value),
    newValue: parseSettingValue(log.new_value),
    changedBy: log.changed_by,
    changeReason: log.change_reason,
    createdAt: log.created_at,
  }));
};

const getSystemSettings = async () => {
  const allSettings = await getAllSettings();
  const systemSettings = {};
  
  Object.keys(allSettings).forEach(key => {
    const setting = allSettings[key];
    const { _meta, ...value } = setting;
    systemSettings[key] = value;
  });
  
  return systemSettings;
};

const invalidateCache = () => {
  settingsCache = null;
  cacheTimestamp = null;
};

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
  updateSettings,
  resetToDefaults,
  lockSetting,
  unlockSetting,
  getAuditLog,
  getSystemSettings,
  canChangeFinancialYear,
  invalidateCache,
};
