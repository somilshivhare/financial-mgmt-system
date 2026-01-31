const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');

// In-memory cache for settings (refreshed on updates)
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000; // 1 minute

/**
 * Get all settings with caching
 */
const getAllSettings = async (useCache = true) => {
  const now = Date.now();
  
  if (useCache && settingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    return settingsCache;
  }
  
  try {
    const settings = await query(
      'SELECT setting_key, setting_value, setting_type, is_locked, lock_reason, updated_at, created_at FROM settings ORDER BY setting_key'
    );
    
    // Transform to object format
    const settingsObj = {};
    if (settings && Array.isArray(settings)) {
      settings.forEach(setting => {
        try {
          settingsObj[setting.setting_key] = {
            ...JSON.parse(setting.setting_value),
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
    // If settings table doesn't exist or query fails, return empty object
    console.warn('[Settings] Failed to load settings, returning empty object:', err.message);
    return {};
  }
};

/**
 * Get a specific setting by key
 */
const getSetting = async (key) => {
  const [setting] = await query(
    'SELECT setting_key, setting_value, setting_type, is_locked, lock_reason, updated_at, created_at FROM settings WHERE setting_key = ?',
    [key]
  );
  
  if (!setting) return null;
  
  return {
    ...JSON.parse(setting.setting_value),
    _meta: {
      type: setting.setting_type,
      isLocked: setting.is_locked,
      lockReason: setting.lock_reason,
      updatedAt: setting.updated_at,
      createdAt: setting.created_at,
    }
  };
};

/**
 * Check if financial year can be changed (no transactions exist)
 */
const canChangeFinancialYear = async (newFinancialYear) => {
  // Check if any invoices exist for the current financial year
  const [invoices] = await query(
    'SELECT COUNT(*) as count FROM invoices WHERE YEAR(created_at) IN (?, ?)',
    [newFinancialYear.split('-')[0], newFinancialYear.split('-')[1]]
  );
  
  // Check if any payments exist
  const [payments] = await query('SELECT COUNT(*) as count FROM payments');
  
  // If transactions exist, cannot change financial year
  if (invoices.count > 0 || payments.count > 0) {
    const currentFY = await getSetting('general');
    if (currentFY && currentFY.financialYear !== newFinancialYear) {
      return {
        allowed: false,
        reason: 'Cannot change financial year: Transactions already exist in the system. Financial year changes are only allowed before any transactions are recorded.',
      };
    }
  }
  
  return { allowed: true };
};

/**
 * Update a setting
 */
const updateSetting = async (key, value, userId, changeReason = null) => {
  return transaction(async (conn) => {
    // Get old value for audit
    const [oldSetting] = await conn.execute(
      'SELECT setting_value, setting_type, is_locked FROM settings WHERE setting_key = ?',
      [key]
    );
    
    if (!oldSetting || oldSetting.length === 0) {
      throw new Error('SETTING_NOT_FOUND');
    }
    
    const oldValue = JSON.parse(oldSetting[0].setting_value);
    
    // Validate financial year change
    if (key === 'general' && value.financialYear && oldValue.financialYear !== value.financialYear) {
      const validation = await canChangeFinancialYear(value.financialYear);
      if (!validation.allowed) {
        throw new Error(validation.reason);
      }
    }
    
    // Check if setting is locked
    if (oldSetting[0].is_locked) {
      throw new Error(`SETTING_LOCKED: ${oldSetting[0].lock_reason || 'This setting cannot be changed'}`);
    }
    
    // Update setting
    await conn.execute(
      'UPDATE settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
      [JSON.stringify(value), userId, key]
    );
    
    // Log audit trail
    const auditId = uuidv4();
    await conn.execute(
      `INSERT INTO settings_audit_log (id, setting_key, old_value, new_value, changed_by, change_reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [auditId, key, JSON.stringify(oldValue), JSON.stringify(value), userId, changeReason]
    );
    
  // Invalidate caches
  settingsCache = null;
  cacheTimestamp = null;
  
  // Get updated setting
    const [updated] = await conn.execute(
      'SELECT setting_key, setting_value, setting_type, updated_at FROM settings WHERE setting_key = ?',
      [key]
    );
    
    return {
      key: updated[0].setting_key,
      value: JSON.parse(updated[0].setting_value),
      type: updated[0].setting_type,
      updatedAt: updated[0].updated_at,
    };
  });
};

/**
 * Update multiple settings at once
 */
const updateSettings = async (settingsObj, userId, changeReason = null) => {
  const results = {};
  
  // Update each setting (each in its own transaction for safety)
  for (const [key, value] of Object.entries(settingsObj)) {
    const result = await updateSetting(key, value, userId, changeReason);
    results[key] = result;
  }
  
  return results;
};

/**
 * Reset settings to defaults
 */
const resetToDefaults = async (userId, settingKeys = null) => {
  const defaults = {
    general: {
      companyName: 'NB Aurum',
      companyEmail: 'finance@nbaurum.com',
      companyPhone: '+91 00000 00000',
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

/**
 * Lock a setting (e.g., financial year when transactions exist)
 */
const lockSetting = async (key, reason, userId) => {
  await query(
    'UPDATE settings SET is_locked = TRUE, lock_reason = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
    [reason, userId, key]
  );
  
  // Invalidate cache
  settingsCache = null;
  cacheTimestamp = null;
};

/**
 * Unlock a setting
 */
const unlockSetting = async (key, userId) => {
  await query(
    'UPDATE settings SET is_locked = FALSE, lock_reason = NULL, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
    [userId, key]
  );
  
  // Invalidate cache
  settingsCache = null;
  cacheTimestamp = null;
};

/**
 * Get settings audit log
 */
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
    oldValue: JSON.parse(log.old_value || '{}'),
    newValue: JSON.parse(log.new_value),
    changedBy: log.changed_by,
    changeReason: log.change_reason,
    createdAt: log.created_at,
  }));
};

/**
 * Get system settings (for use across modules)
 * This is a convenience method that returns settings without metadata
 */
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

/**
 * Invalidate cache (for use by helper module)
 */
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
