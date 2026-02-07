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
  
  let invoiceId = payload.invoiceId;
  if (!invoiceId && payload.customerId) {
    const invoices = await query(
      `SELECT id FROM invoices WHERE customer_id = ? AND status NOT IN ('cancelled') ORDER BY issue_date DESC LIMIT 1`,
      [payload.customerId]
    );
    if (invoices.length > 0) {
      invoiceId = invoices[0].id;
    }
  }
  
  if (!invoiceId && !payload.customerId) {
    throw new Error('INVOICE_ID_OR_CUSTOMER_ID_REQUIRED');
  }
  
  if (!invoiceId && payload.customerId) {
    const invoices = await query(
      `SELECT id FROM invoices 
       WHERE customer_id = ? 
       AND status NOT IN ('cancelled')
       ${payload.month ? 'AND YEAR(issue_date) = ? AND MONTH(issue_date) = ?' : ''}
       ORDER BY issue_date DESC`,
      payload.month 
        ? [payload.customerId, new Date(payload.month + '-01').getFullYear(), new Date(payload.month + '-01').getMonth() + 1]
        : [payload.customerId]
    );
    
    if (invoices.length === 0) {
      throw new Error('NO_INVOICES_FOUND');
    }
    
    const results = [];
    for (const inv of invoices) {
      const existing = await query(
        'SELECT id FROM collection_plans WHERE invoice_id = ?',
        [inv.id]
      );
      
      if (existing.length > 0) {
        await query(
          `UPDATE collection_plans 
           SET expected_amount = ?, target_date = COALESCE(?, target_date), updated_at = NOW()
           WHERE invoice_id = ?`,
          [payload.expectedAmount || payload.planFinalised, payload.targetDate || null, inv.id]
        );
        const [plan] = await query('SELECT * FROM collection_plans WHERE invoice_id = ?', [inv.id]);
        results.push(plan[0]);
      } else {
        const planId = uuidv4();
        await query(
          `INSERT INTO collection_plans (id, invoice_id, target_date, expected_amount, status, owner_user_id, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            planId,
            inv.id,
            payload.targetDate || new Date().toISOString().split('T')[0],
            (payload.expectedAmount || payload.planFinalised || 0) / invoices.length, // Distribute amount across invoices
            payload.status || 'planned',
            userId,
            payload.notes || null
          ]
        );
        const [plan] = await query('SELECT * FROM collection_plans WHERE id = ?', [planId]);
        results.push(plan[0]);
      }
    }
    return results[0]; // Return first plan
  }
  
  const existing = await query(
    'SELECT id FROM collection_plans WHERE invoice_id = ?',
    [invoiceId]
  );
  
  if (existing.length > 0) {
    await query(
      `UPDATE collection_plans 
       SET expected_amount = ?, target_date = COALESCE(?, target_date), updated_at = NOW()
       WHERE invoice_id = ?`,
      [payload.expectedAmount || payload.planFinalised, payload.targetDate || null, invoiceId]
    );
    const [plan] = await query('SELECT * FROM collection_plans WHERE invoice_id = ?', [invoiceId]);
    return plan[0];
  } else {
    await query(
      `INSERT INTO collection_plans (id, invoice_id, target_date, expected_amount, status, owner_user_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        invoiceId, 
        payload.targetDate || new Date().toISOString().split('T')[0], 
        payload.expectedAmount || payload.planFinalised || 0, 
        payload.status || 'planned', 
        userId, 
        payload.notes || null
      ],
    );
    const [plan] = await query('SELECT * FROM collection_plans WHERE id = ?', [id]);
    return plan[0];
  }
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

const getCollectionPlanData = async (filters = {}) => {
  const { personId, businessUnit, month } = filters;
  const where = [];
  const params = [];
  
  const currentDate = month ? new Date(month) : new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  let querySql = `
    SELECT 
      'Unassigned' as collectionIncharge,
      c.name as customerName,
      'N/A' as segment,
      'N/A' as packageName,
      c.id as customerId,
      SUM(COALESCE(i.total_amount, 0)) as totalOutstanding,
      SUM(CASE 
        WHEN i.due_date >= CURDATE() THEN COALESCE(i.balance, i.total_amount, 0)
        ELSE 0 
      END) as notDue,
      SUM(CASE 
        WHEN i.due_date < CURDATE() AND i.balance > 0 THEN COALESCE(i.balance, i.total_amount, 0)
        ELSE 0 
      END) as overdue,
      SUM(CASE 
        WHEN YEAR(i.due_date) = ? AND MONTH(i.due_date) = ? THEN COALESCE(i.balance, i.total_amount, 0)
        ELSE 0 
      END) as dueThisMonth,
      SUM(COALESCE(i.balance, i.total_amount, 0)) as totalDueForPlan,
      COALESCE(SUM(cp.expected_amount), 0) as planFinalised,
      COALESCE(SUM(p.amount), 0) as received,
      COALESCE(SUM(COALESCE(p.tds, 0) + COALESCE(p.bank_charges, 0) + COALESCE(p.penalty, 0) + COALESCE(p.other_deductions, 0)), 0) as statutoryDeductions,
      SUM(COALESCE(i.balance, i.total_amount, 0)) - COALESCE(SUM(p.amount), 0) as balance,
      CASE 
        WHEN COALESCE(SUM(cp.expected_amount), 0) > 0 
        THEN ((COALESCE(SUM(p.amount), 0) + COALESCE(SUM(COALESCE(p.tds, 0) + COALESCE(p.bank_charges, 0) + COALESCE(p.penalty, 0) + COALESCE(p.other_deductions, 0)), 0)) / SUM(cp.expected_amount) * 100)
        ELSE 0 
      END as targetAchieved
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    LEFT JOIN collection_plans cp ON cp.invoice_id = i.id
    LEFT JOIN payments p ON p.invoice_id = i.id AND p.status = 'cleared'
    WHERE i.status NOT IN ('cancelled')
  `;
  
  params.push(currentYear, currentMonth);
  
  if (personId) {
  }
  
  if (businessUnit) {
  }
  
  if (month) {
    try {
      const monthDate = typeof month === 'string' && month.includes('-') 
        ? new Date(month + '-01')
        : new Date(month);
      where.push('YEAR(i.issue_date) = ? AND MONTH(i.issue_date) = ?');
      params.push(monthDate.getFullYear(), monthDate.getMonth() + 1);
    } catch (e) {
      console.error('Invalid month format:', month);
    }
  }
  
  if (where.length > 0) {
    querySql += ' AND ' + where.join(' AND ');
  }
  
  querySql += ' GROUP BY c.id, c.name ORDER BY c.name';
  
  const data = await query(querySql, params);
  
  return data.map(row => ({
    id: row.customerId,
    customerId: row.customerId,
    collectionIncharge: row.collectionIncharge || 'Unassigned',
    customerName: row.customerName || 'Unknown',
    segment: row.segment || 'N/A',
    packageName: row.packageName || 'N/A',
    totalOutstanding: parseFloat(row.totalOutstanding || 0),
    notDue: parseFloat(row.notDue || 0),
    overdue: parseFloat(row.overdue || 0),
    dueThisMonth: parseFloat(row.dueThisMonth || 0),
    totalDueForPlan: parseFloat(row.totalDueForPlan || 0),
    planFinalised: parseFloat(row.planFinalised || 0),
    received: parseFloat(row.received || 0),
    statutoryDeductions: parseFloat(row.statutoryDeductions || 0),
    balance: parseFloat(row.balance || 0),
    targetAchieved: parseFloat(row.targetAchieved || 0),
  }));
};

const getCollectionAnalytics = async (filters = {}) => {
  const { personId, businessUnit, month } = filters;
  const where = [];
  const params = [];
  
  let querySql = `
    SELECT 
      COALESCE(SUM(cp.expected_amount), 0) as planned,
      COALESCE(SUM(p.amount), 0) as collected,
      COALESCE(SUM(cp.expected_amount), 0) - COALESCE(SUM(p.amount), 0) as balance,
      SUM(CASE 
        WHEN i.due_date < CURDATE() AND i.balance > 0 THEN COALESCE(i.balance, i.total_amount, 0)
        ELSE 0 
      END) as overdue,
      SUM(CASE 
        WHEN i.due_date >= CURDATE() THEN COALESCE(i.balance, i.total_amount, 0)
        ELSE 0 
      END) as notDue
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    LEFT JOIN collection_plans cp ON cp.invoice_id = i.id
    LEFT JOIN payments p ON p.invoice_id = i.id AND p.status = 'cleared'
    WHERE i.status NOT IN ('cancelled')
  `;
  
  if (month) {
    try {
      const monthDate = typeof month === 'string' && month.includes('-') 
        ? new Date(month + '-01')
        : new Date(month);
      where.push('YEAR(i.issue_date) = ? AND MONTH(i.issue_date) = ?');
      params.push(monthDate.getFullYear(), monthDate.getMonth() + 1);
    } catch (e) {
      console.error('Invalid month format:', month);
    }
  }
  
  if (where.length > 0) {
    querySql += ' AND ' + where.join(' AND ');
  }
  
  const [overall] = await query(querySql, params);
  
  const targetByPerson = {};
  
  if (overall && parseFloat(overall.planned || 0) > 0) {
    targetByPerson['All Persons'] = {
      planned: parseFloat(overall.planned || 0),
      collected: parseFloat(overall.collected || 0),
      targetAchieved: parseFloat(overall.planned || 0) > 0 
        ? (parseFloat(overall.collected || 0) / parseFloat(overall.planned || 0) * 100)
        : 0,
    };
  }
  
  return {
    plannedVsCollected: {
      planned: parseFloat(overall?.planned || 0),
      collected: parseFloat(overall?.collected || 0),
      balance: parseFloat(overall?.balance || 0),
    },
    targetByPerson,
    overdueVsNotDue: {
      overdue: parseFloat(overall?.overdue || 0),
      notDue: parseFloat(overall?.notDue || 0),
    },
  };
};

module.exports = { 
  listPlans, 
  createPlan, 
  updatePlanStatus, 
  listActions, 
  addAction,
  getCollectionPlanData,
  getCollectionAnalytics,
};

