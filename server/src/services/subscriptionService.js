const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/query');

const safeJsonParse = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value; // mysql may already return parsed JSON in some configs
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getSubscription = async () => {
  const rows = await query('SELECT * FROM subscriptions ORDER BY updated_at DESC LIMIT 1');
  return rows[0] || null;
};

const getSubscriptionForUser = async (userId) => {
  try {
    const rows = await query(
      `SELECT s.*, sp.display_name, sp.storage_limit_gb, sp.features as plan_features
       FROM subscriptions s
       LEFT JOIN subscription_plans sp ON sp.plan_name = s.plan
       WHERE s.user_id = ? OR s.organization_id IN (SELECT organization_id FROM users WHERE id = ?)
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId, userId],
    );
    const sub = rows[0] || null;
    if (!sub) return null;
    return {
      ...sub,
      metadata: safeJsonParse(sub.metadata, {}),
      plan_features: safeJsonParse(sub.plan_features, {}),
    };
  } catch (err) {
    // If migrations haven't added user_id / subscription_plans yet, fall back to global subscription.
    const sub = await getSubscription();
    if (!sub) return null;
    return {
      ...sub,
      metadata: safeJsonParse(sub.metadata, {}),
      plan_features: {},
    };
  }
};

const listActivePlans = async () => {
  try {
    const rows = await query(
      `SELECT id, plan_name, display_name, storage_limit_gb, features, is_active
       FROM subscription_plans
       WHERE is_active = TRUE
       ORDER BY FIELD(plan_name, 'trial','basic','professional','enterprise'), display_name ASC`,
    );
    return rows.map((r) => ({
      id: r.id,
      plan_name: r.plan_name,
      display_name: r.display_name,
      storage_limit_gb: r.storage_limit_gb,
      features: safeJsonParse(r.features, {}),
      is_active: !!r.is_active,
    }));
  } catch (_err) {
    // Fallback when subscription_plans table doesn't exist yet
    return [
      {
        id: 'trial',
        plan_name: 'trial',
        display_name: 'Trial',
        storage_limit_gb: 1,
        features: { max_users: 1, support_level: 'community' },
        is_active: true,
      },
      {
        id: 'basic',
        plan_name: 'basic',
        display_name: 'Basic',
        storage_limit_gb: 10,
        features: { max_users: 5, support_level: 'email' },
        is_active: true,
      },
      {
        id: 'professional',
        plan_name: 'professional',
        display_name: 'Professional',
        storage_limit_gb: 50,
        features: { max_users: 25, support_level: 'priority' },
        is_active: true,
      },
      {
        id: 'enterprise',
        plan_name: 'enterprise',
        display_name: 'Enterprise',
        storage_limit_gb: 500,
        features: { max_users: -1, support_level: 'dedicated' },
        is_active: true,
      },
    ];
  }
};

const getBillingBundleForUser = async (userId) => {
  const sub = await getSubscriptionForUser(userId);
  const meta = sub?.metadata || {};

  // The frontend expects { billingInfo, invoices, history } in `data`
  const billingInfo =
    meta.billingInfo ||
    meta.billing_info || {
      paymentMethod: meta.paymentMethod || meta.payment_method || null,
      billingAddress: meta.billingAddress || meta.billing_address || null,
    };

  return {
    billingInfo,
    invoices: Array.isArray(meta.invoices) ? meta.invoices : Array.isArray(meta.invoiceHistory) ? meta.invoiceHistory : [],
    history: Array.isArray(meta.history) ? meta.history : Array.isArray(meta.subscriptionHistory) ? meta.subscriptionHistory : [],
  };
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

const upsertSubscriptionForUser = async (userId, payload) => {
  const existing = await getSubscriptionForUser(userId);

  // Normalize metadata merge
  const incomingMeta = payload.metadata ? payload.metadata : {};
  const mergedMeta = {
    ...(existing?.metadata || {}),
    ...incomingMeta,
  };

  if (existing) {
    await query(
      `UPDATE subscriptions
       SET plan = ?, status = ?, seats = ?, starts_at = ?, ends_at = ?, metadata = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        payload.plan || existing.plan,
        payload.status || existing.status,
        payload.seats ?? existing.seats,
        payload.startsAt ?? existing.starts_at,
        payload.endsAt ?? existing.ends_at,
        JSON.stringify(mergedMeta),
        existing.id,
      ],
    );
    return await getSubscriptionForUser(userId);
  }

  const id = uuidv4();
  try {
    await query(
      `INSERT INTO subscriptions (id, user_id, organization_id, plan, status, seats, starts_at, ends_at, metadata)
       VALUES (?, ?, (SELECT organization_id FROM users WHERE id = ?), ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        userId,
        payload.plan || 'trial',
        payload.status || 'trial',
        payload.seats || 1,
        payload.startsAt || null,
        payload.endsAt || null,
        JSON.stringify(mergedMeta),
      ],
    );
  } catch (_err) {
    // Fallback for older schemas (no user_id / organization_id columns)
    await query(
      `INSERT INTO subscriptions (id, plan, status, seats, starts_at, ends_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.plan || 'trial',
        payload.status || 'trial',
        payload.seats || 1,
        payload.startsAt || null,
        payload.endsAt || null,
        JSON.stringify(mergedMeta),
      ],
    );
  }
  return await getSubscriptionForUser(userId);
};

const appendSubscriptionHistory = async (userId, historyItem) => {
  const existing = await getSubscriptionForUser(userId);
  if (!existing) return null;
  const meta = existing.metadata || {};
  const history = Array.isArray(meta.history) ? meta.history : [];
  const newHistory = [historyItem, ...history].slice(0, 50);
  return await upsertSubscriptionForUser(userId, { metadata: { ...meta, history: newHistory } });
};

module.exports = {
  getSubscription,
  upsertSubscription,

  // New, user-scoped APIs used by subscription page
  getSubscriptionForUser,
  upsertSubscriptionForUser,
  listActivePlans,
  getBillingBundleForUser,
  appendSubscriptionHistory,
};

