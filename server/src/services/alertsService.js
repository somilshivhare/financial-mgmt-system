const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/query');

const listAlerts = async (userId) => {
  return query('SELECT * FROM alerts WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 100', [userId]);
};

const createAlert = async (payload, createdBy) => {
  const id = uuidv4();
  await query(
    `INSERT INTO alerts (id, user_id, alert_type, message, link_url, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'new', NOW(), NOW())`,
    [id, payload.userId || null, payload.alertType, payload.message, payload.linkUrl || null],
  );
  const [alert] = await query('SELECT * FROM alerts WHERE id = ?', [id]);
  return alert;
};

const updateAlertStatus = async (id, status) => {
  await query('UPDATE alerts SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
  const [alert] = await query('SELECT * FROM alerts WHERE id = ?', [id]);
  return alert;
};

module.exports = { listAlerts, createAlert, updateAlertStatus };

