const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/query');

const listSettings = async () => {
  return query('SELECT setting_key AS settingKey, setting_value AS settingValue, updated_at, created_at FROM settings');
};

const upsertSetting = async (payload, userId) => {
  const existing = await query('SELECT id FROM settings WHERE setting_key = ?', [payload.settingKey]);
  if (existing[0]) {
    await query('UPDATE settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?', [
      JSON.stringify(payload.settingValue),
      userId,
      payload.settingKey,
    ]);
    const [setting] = await query(
      'SELECT setting_key AS settingKey, setting_value AS settingValue FROM settings WHERE setting_key = ?',
      [payload.settingKey],
    );
    return setting;
  }
  const id = uuidv4();
  await query(
    'INSERT INTO settings (id, setting_key, setting_value, updated_by, updated_at, created_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [id, payload.settingKey, JSON.stringify(payload.settingValue), userId],
  );
  const [setting] = await query(
    'SELECT setting_key AS settingKey, setting_value AS settingValue FROM settings WHERE id = ?',
    [id],
  );
  return setting;
};

module.exports = { listSettings, upsertSetting };

