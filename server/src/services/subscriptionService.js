const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/query');

const getSubscription = async () => {
  const rows = await query('SELECT * FROM subscriptions ORDER BY updated_at DESC LIMIT 1');
  return rows[0] || null;
};

const upsertSubscription = async (payload) => {
  const existing = await getSubscription();
  if (existing) {
    await query(
      `UPDATE subscriptions
       SET plan = ?, status = ?, seats = ?, starts_at = ?, ends_at = ?, metadata = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        payload.plan,
        payload.status || existing.status,
        payload.seats || existing.seats,
        payload.startsAt || existing.starts_at,
        payload.endsAt || existing.ends_at,
        JSON.stringify(payload.metadata || {}),
        existing.id,
      ],
    );
    const [sub] = await query('SELECT * FROM subscriptions WHERE id = ?', [existing.id]);
    return sub;
  }
  const id = uuidv4();
  await query(
    `INSERT INTO subscriptions (id, plan, status, seats, starts_at, ends_at, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, payload.plan, payload.status || 'trial', payload.seats || 1, payload.startsAt || null, payload.endsAt || null, JSON.stringify(payload.metadata || {})],
  );
  const [sub] = await query('SELECT * FROM subscriptions WHERE id = ?', [id]);
  return sub;
};

module.exports = { getSubscription, upsertSubscription };

