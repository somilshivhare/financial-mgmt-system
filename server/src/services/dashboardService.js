const { query } = require('../db/query');
const { getCurrency } = require('../utils/settingsHelper');

const getEmptyDashboardResponse = () => ({
  kpis: {
    totalOutstanding: 0,
    totalCollected: 0,
    totalOverdue: 0,
    duesCurrentMonth: 0,
    totalBalance: 0,
    collectionTarget: 0,
    collectionAchieved: 0,
    collectionTargetAchieved: 0,
    currency: 'INR',
  },
  invoiceInsights: { byStatus: [], recent: [] },
  paymentsCollections: { upcomingFollowUps: [], overdueHighlights: [] },
});

const getDashboard = async (userId, filters = {}) => {
  // Strict: every user sees only their own data. No data if userId is missing.
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return getEmptyDashboardResponse();
  }
  const effectiveUserId = userId.trim();

  const { dateFrom, dateTo } = filters;
  const dateConditions = [];
  const dateParams = [];

  // Always restrict to current user's invoices only
  const userCondition = 'i.created_by = ?';
  const userParams = [effectiveUserId];

  if (dateFrom) {
    dateConditions.push('i.issue_date >= ?');
    dateParams.push(dateFrom);
  }
  if (dateTo) {
    dateConditions.push('i.issue_date <= ?');
    dateParams.push(dateTo + ' 23:59:59');
  }
  const allConditions = [userCondition, ...dateConditions];
  const baseParams = [...userParams, ...dateParams];
  const baseWhere = `WHERE ${allConditions.join(' AND ')}`;

  let currency = 'INR';
  try {
    currency = await getCurrency();
  } catch (err) {
    console.warn('[Dashboard] Failed to get currency from settings, using default INR:', err.message);
  }

  // KPIs: use separate queries so we only ever aggregate the current user's invoices (no JOIN double-count)
  let kpiData = [{ totalOutstanding: 0, totalCollected: 0, totalOverdue: 0, duesCurrentMonth: 0, totalBalance: 0, collectionTarget: 0, collectionAchieved: 0 }];
  try {
    const [invoiceSums] = await query(
      `SELECT 
        COALESCE(SUM(i.balance), 0) as totalOutstanding,
        COALESCE(SUM(CASE WHEN i.due_date < CURDATE() AND i.balance > 0 AND i.status NOT IN ('cancelled','paid') THEN i.balance ELSE 0 END), 0) as totalOverdue,
        COALESCE(SUM(CASE WHEN YEAR(i.due_date) = YEAR(CURDATE()) AND MONTH(i.due_date) = MONTH(CURDATE()) AND i.balance > 0 THEN i.balance ELSE 0 END), 0) as duesCurrentMonth,
        COALESCE(SUM(i.total_amount), 0) as totalBalance
      FROM invoices i
      ${baseWhere}`,
      baseParams
    );
    const collWhere = ['i.created_by = ?', 'p.status = \'cleared\''];
    const collParams = [effectiveUserId];
    if (dateFrom) {
      collWhere.push('i.issue_date >= ?');
      collParams.push(dateFrom);
    }
    if (dateTo) {
      collWhere.push('i.issue_date <= ?');
      collParams.push(dateTo + ' 23:59:59');
    }
    const [collectionSums] = await query(
      `SELECT COALESCE(SUM(p.amount), 0) as totalCollected
       FROM payments p
       INNER JOIN invoices i ON i.id = p.invoice_id
       WHERE ${collWhere.join(' AND ')}`,
      collParams
    );
    const targetWhere = ['i.created_by = ?'];
    const targetParams = [effectiveUserId];
    if (dateFrom) {
      targetWhere.push('i.issue_date >= ?');
      targetParams.push(dateFrom);
    }
    if (dateTo) {
      targetWhere.push('i.issue_date <= ?');
      targetParams.push(dateTo + ' 23:59:59');
    }
    const [targetSums] = await query(
      `SELECT 
        COALESCE(SUM(cp.expected_amount), 0) as collectionTarget,
        COALESCE(SUM(CASE WHEN p.status = 'cleared' THEN p.amount ELSE 0 END), 0) as collectionAchieved
      FROM collection_plans cp
      INNER JOIN invoices i ON i.id = cp.invoice_id
      LEFT JOIN payments p ON p.invoice_id = cp.invoice_id AND p.status = 'cleared'
      WHERE ${targetWhere.join(' AND ')}`,
      targetParams
    );
    const inv = (Array.isArray(invoiceSums) && invoiceSums[0]) ? invoiceSums[0] : (invoiceSums && typeof invoiceSums === 'object' && !Array.isArray(invoiceSums) ? invoiceSums : {});
    const coll = (Array.isArray(collectionSums) && collectionSums[0]) ? collectionSums[0] : (collectionSums && typeof collectionSums === 'object' && !Array.isArray(collectionSums) ? collectionSums : {});
    const tgt = (Array.isArray(targetSums) && targetSums[0]) ? targetSums[0] : (targetSums && typeof targetSums === 'object' && !Array.isArray(targetSums) ? targetSums : {});
    kpiData = [{
      totalOutstanding: inv.totalOutstanding ?? 0,
      totalCollected: coll.totalCollected ?? 0,
      totalOverdue: inv.totalOverdue ?? 0,
      duesCurrentMonth: inv.duesCurrentMonth ?? 0,
      totalBalance: inv.totalBalance ?? 0,
      collectionTarget: tgt.collectionTarget ?? 0,
      collectionAchieved: tgt.collectionAchieved ?? 0,
    }];
  } catch (err) {
    console.error('[Dashboard] Error fetching KPI data:', err.message);
  }

  const kpis = kpiData[0] || {};
  const collectionTargetAchieved = kpis.collectionTarget > 0 
    ? ((kpis.collectionAchieved / kpis.collectionTarget) * 100).toFixed(2)
    : 0;

  let invoicesByStatus = [];
  try {
    invoicesByStatus = await query(
      `SELECT status, COUNT(*) as count 
       FROM invoices i
       ${baseWhere}
       GROUP BY status`,
      baseParams
    );
  } catch (err) {
    console.error('[Dashboard] Error fetching invoices by status:', err.message);
  }

  let recentInvoices = [];
  try {
    recentInvoices = await query(
      `SELECT 
        i.id,
        i.invoice_number,
        i.issue_date,
        i.due_date,
        i.status,
        i.total_amount,
        i.amount_paid,
        i.balance,
        c.name as customer_name,
        DATEDIFF(CURDATE(), i.due_date) as days_overdue
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      ${baseWhere}
      ORDER BY i.issue_date DESC
      LIMIT 10`,
      baseParams
    );
  } catch (err) {
    console.error('[Dashboard] Error fetching recent invoices:', err.message);
  }

  const followUpWhereConditions = ['i.created_by = ?', 'i.balance > 0', 'i.due_date >= CURDATE()', "i.status NOT IN ('cancelled','paid')"];
  const followUpWhereParams = [effectiveUserId];
  if (dateConditions.length > 0) {
    followUpWhereConditions.push(...dateConditions);
    followUpWhereParams.push(...dateParams);
  }
  const followUpWhere = `WHERE ${followUpWhereConditions.join(' AND ')}`;
  
  let upcomingFollowUps = [];
  try {
    upcomingFollowUps = await query(
      `SELECT 
        i.id,
        i.invoice_number,
        i.due_date,
        i.balance,
        c.name as customer_name,
        DATEDIFF(i.due_date, CURDATE()) as days_until_due
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      ${followUpWhere}
      ORDER BY i.due_date ASC
      LIMIT 10`,
      followUpWhereParams
    );
  } catch (err) {
    console.error('[Dashboard] Error fetching upcoming follow-ups:', err.message);
  }

  const overdueWhereConditions = ['i.created_by = ?', 'i.due_date < CURDATE()', 'i.balance > 0', "i.status NOT IN ('cancelled','paid')"];
  const overdueWhereParams = [effectiveUserId];
  if (dateConditions.length > 0) {
    overdueWhereConditions.push(...dateConditions);
    overdueWhereParams.push(...dateParams);
  }
  const overdueWhere = `WHERE ${overdueWhereConditions.join(' AND ')}`;
  
  let overdueHighlights = [];
  try {
    overdueHighlights = await query(
      `SELECT 
        i.id,
        i.invoice_number,
        i.due_date,
        i.balance,
        c.name as customer_name,
        DATEDIFF(CURDATE(), i.due_date) as days_overdue
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      ${overdueWhere}
      ORDER BY i.due_date ASC, i.balance DESC
      LIMIT 10`,
      overdueWhereParams
    );
  } catch (err) {
    console.error('[Dashboard] Error fetching overdue highlights:', err.message);
  }

  return {
    kpis: {
      totalOutstanding: parseFloat(kpis.totalOutstanding || 0),
      totalCollected: parseFloat(kpis.totalCollected || 0),
      totalOverdue: parseFloat(kpis.totalOverdue || 0),
      collectionTargetAchieved: parseFloat(collectionTargetAchieved),
      duesCurrentMonth: parseFloat(kpis.duesCurrentMonth || 0),
      totalBalance: parseFloat(kpis.totalBalance || 0),
      collectionTarget: parseFloat(kpis.collectionTarget || 0),
      currency,
    },
    invoiceInsights: {
      byStatus: invoicesByStatus,
      recent: recentInvoices,
    },
    paymentsCollections: {
      upcomingFollowUps,
      overdueHighlights,
    },
  };
};

const getAnalytics = async (userId, filters = {}) => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return { monthlyInvoicesVsCollections: [], outstandingTrends: [], realizationPercentages: [] };
  }
  const effectiveUserId = userId.trim();
  const { dateFrom, dateTo, period = 'monthly' } = filters;
  const dateConditions = ['i.created_by = ?'];
  const dateParams = [effectiveUserId];

  if (dateFrom) {
    dateConditions.push('i.issue_date >= ?');
    dateParams.push(dateFrom);
  }
  if (dateTo) {
    dateConditions.push('i.issue_date <= ?');
    dateParams.push(dateTo + ' 23:59:59');
  }
  const analyticsWhere = `WHERE ${dateConditions.join(' AND ')}`;

  const monthlyData = await query(
    `SELECT 
      DATE_FORMAT(i.issue_date, '%Y-%m') as month,
      COALESCE(SUM(i.total_amount), 0) as invoices,
      COALESCE(SUM(CASE WHEN p.status = 'cleared' THEN p.amount ELSE 0 END), 0) as collections
    FROM invoices i
      LEFT JOIN payments p ON p.invoice_id = i.id AND DATE_FORMAT(p.paid_at, '%Y-%m') = DATE_FORMAT(i.issue_date, '%Y-%m')
    ${analyticsWhere}
    GROUP BY DATE_FORMAT(i.issue_date, '%Y-%m')
    ORDER BY month ASC`,
    dateParams
  );

  const outstandingTrends = await query(
    `SELECT 
      DATE_FORMAT(i.issue_date, '%Y-%m') as month,
      COALESCE(SUM(i.balance), 0) as outstanding
    FROM invoices i
    ${analyticsWhere}
    GROUP BY DATE_FORMAT(i.issue_date, '%Y-%m')
    ORDER BY month ASC`,
    dateParams
  );

  const realizationData = await query(
    `SELECT 
      DATE_FORMAT(i.issue_date, '%Y-%m') as month,
      COALESCE(SUM(i.total_amount), 0) as invoiced,
      COALESCE(SUM(CASE WHEN p.status = 'cleared' THEN p.amount ELSE 0 END), 0) as collected,
      CASE 
        WHEN SUM(i.total_amount) > 0 
        THEN (SUM(CASE WHEN p.status = 'cleared' THEN p.amount ELSE 0 END) / SUM(i.total_amount) * 100)
        ELSE 0 
      END as realizationPercent
    FROM invoices i
      LEFT JOIN payments p ON p.invoice_id = i.id
    ${analyticsWhere}
    GROUP BY DATE_FORMAT(i.issue_date, '%Y-%m')
    ORDER BY month ASC`,
    dateParams
  );

  return {
    monthlyInvoicesVsCollections: monthlyData,
    outstandingTrends,
    realizationPercentages: realizationData,
  };
};

const getSubscriptionUsage = async (userId) => {
  const [subscription] = await query(
    `SELECT s.*, sp.storage_limit_gb, sp.features
     FROM subscriptions s
     LEFT JOIN subscription_plans sp ON sp.plan_name = s.plan
     WHERE s.user_id = ? OR s.organization_id IN (SELECT organization_id FROM users WHERE id = ?)
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId, userId]
  );

  const [storageUsage] = await query(
    `SELECT 
      COALESCE(total_gb, 0) as storageUsedGb,
      COALESCE(file_count, 0) as fileCount
    FROM storage_usage_cache
    WHERE user_id = ?`,
    [userId]
  );

  const plan = subscription || { plan: 'trial', storage_limit_gb: 1.0 };
  const usage = storageUsage || { storageUsedGb: 0, fileCount: 0 };
  const storageLimit = parseFloat(plan.storage_limit_gb || 1.0);
  const storageUsed = parseFloat(usage.storageUsedGb || 0);
  const usagePercentage = storageLimit > 0 ? ((storageUsed / storageLimit) * 100).toFixed(2) : 0;

  return {
    plan: {
      name: plan.plan || 'trial',
      displayName: plan.display_name || 'Trial Plan',
      storageLimitGb: storageLimit,
      features: plan.features || {},
    },
    storage: {
      usedGb: storageUsed,
      limitGb: storageLimit,
      usagePercentage: parseFloat(usagePercentage),
      fileCount: parseInt(usage.fileCount || 0),
    },
  };
};

module.exports = { 
  getDashboard,
  getAnalytics,
  getSubscriptionUsage,
};

