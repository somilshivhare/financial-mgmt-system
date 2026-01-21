const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/query');

const listPlans = async ({ page = 1, pageSize = 20, status, invoiceId }) => {
  const offset = (page - 1) * pageSize;
  const where = [];
  const params = [];
  if (status) {
    where.push('cp.status = ?');
    params.push(status);
  }
  if (invoiceId) {
    where.push('cp.invoice_id = ?');
    params.push(invoiceId);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const data = await query(
    `SELECT cp.*, i.invoice_number, c.name as customer_name
     FROM collection_plans cp
     JOIN invoices i ON i.id = cp.invoice_id
     JOIN customers c ON c.id = i.customer_id
     ${whereSql}
     ORDER BY cp.target_date DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(pageSize), Number(offset)],
  );
  const [{ total }] = await query(`SELECT COUNT(*) as total FROM collection_plans cp ${whereSql}`, params);
  return { data, page: Number(page), pageSize: Number(pageSize), total };
};

const createPlan = async (payload, userId) => {
  const id = uuidv4();
  await query(
    `INSERT INTO collection_plans (id, invoice_id, target_date, expected_amount, status, owner_user_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, payload.invoiceId, payload.targetDate, payload.expectedAmount, payload.status || 'planned', userId, payload.notes || null],
  );
  const [plan] = await query('SELECT * FROM collection_plans WHERE id = ?', [id]);
  return plan;
};

const updatePlanStatus = async (planId, status) => {
  await query('UPDATE collection_plans SET status = ?, updated_at = NOW() WHERE id = ?', [status, planId]);
  const [plan] = await query('SELECT * FROM collection_plans WHERE id = ?', [planId]);
  return plan;
};

const listActions = async (planId) => {
  return query('SELECT * FROM collection_actions WHERE plan_id = ? ORDER BY action_date DESC', [planId]);
};

const addAction = async (planId, payload, userId) => {
  const id = uuidv4();
  await query(
    `INSERT INTO collection_actions (id, plan_id, action_date, action_type, outcome, next_step, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, planId, payload.actionDate, payload.actionType, payload.outcome || null, payload.nextStep || null, userId],
  );
  const [action] = await query('SELECT * FROM collection_actions WHERE id = ?', [id]);
  return action;
};

module.exports = { listPlans, createPlan, updatePlanStatus, listActions, addAction };

