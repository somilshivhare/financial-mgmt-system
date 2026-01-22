const { query } = require('../db/query');
const { getCurrency } = require('../utils/settingsHelper');

/**
 * Get comprehensive dashboard KPIs and data
 */
const getDashboard = async (userId, filters = {}) => {
  const { dateFrom, dateTo } = filters;
  const dateConditions = [];
  const dateParams = [];

  // Build date filter conditions
  if (dateFrom) {
    dateConditions.push('i.issue_date >= ?');
    dateParams.push(dateFrom);
  }
  if (dateTo) {
    dateConditions.push('i.issue_date <= ?');
    dateParams.push(dateTo + ' 23:59:59');
  }
  const dateWhere = dateConditions.length ? `WHERE ${dateConditions.join(' AND ')}` : '';

  // Get currency from settings
  const currency = await getCurrency();

  // Financial KPIs - All time totals
  const [kpiData] = await Promise.all([
    query(
      `SELECT 
        COALESCE(SUM(i.balance), 0) as totalOutstanding,
        COALESCE(SUM(CASE WHEN p.status = 'cleared' THEN p.amount ELSE 0 END), 0) as totalCollected,
        COALESCE(SUM(CASE WHEN i.due_date < CURDATE() AND i.balance > 0 AND i.status NOT IN ('cancelled','paid') THEN i.balance ELSE 0 END), 0) as totalOverdue,
        COALESCE(SUM(CASE WHEN YEAR(i.due_date) = YEAR(CURDATE()) AND MONTH(i.due_date) = MONTH(CURDATE()) AND i.balance > 0 THEN i.balance ELSE 0 END), 0) as duesCurrentMonth,
        COALESCE(SUM(i.total_amount), 0) as totalBalance,
        COALESCE(SUM(CASE WHEN cp.expected_amount > 0 THEN cp.expected_amount ELSE 0 END), 0) as collectionTarget,
        COALESCE(SUM(CASE WHEN cp.expected_amount > 0 AND p.status = 'cleared' THEN p.amount ELSE 0 END), 0) as collectionAchieved
      FROM invoices i
      LEFT JOIN payments p ON p.invoice_id = i.id
      LEFT JOIN collection_plans cp ON cp.invoice_id = i.id
      ${dateWhere}`,
      dateParams
    ),
  ]);

  const kpis = kpiData[0] || {};
  const collectionTargetAchieved = kpis.collectionTarget > 0 
    ? ((kpis.collectionAchieved / kpis.collectionTarget) * 100).toFixed(2)
    : 0;

  // Invoice insights - Status counts
  const invoicesByStatus = await query(
    `SELECT status, COUNT(*) as count 
     FROM invoices i
     ${dateWhere}
     GROUP BY status`,
    dateParams
  );

  // Recent invoices (last 10)
  const recentInvoices = await query(
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
    ${dateWhere}
    ORDER BY i.issue_date DESC
    LIMIT 10`,
    dateParams
  );

  // Payment and collections summary
  const upcomingFollowUps = await query(
    `SELECT 
      i.id,
      i.invoice_number,
      i.due_date,
      i.balance,
      c.name as customer_name,
      DATEDIFF(i.due_date, CURDATE()) as days_until_due
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    WHERE i.balance > 0 
      AND i.due_date >= CURDATE() 
      AND i.status NOT IN ('cancelled','paid')
      ${dateConditions.length ? `AND ${dateConditions.join(' AND ')}` : ''}
    ORDER BY i.due_date ASC
    LIMIT 10`,
    dateParams
  );

  const overdueHighlights = await query(
    `SELECT 
      i.id,
      i.invoice_number,
      i.due_date,
      i.balance,
      c.name as customer_name,
      DATEDIFF(CURDATE(), i.due_date) as days_overdue
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    WHERE i.due_date < CURDATE() 
      AND i.balance > 0 
      AND i.status NOT IN ('cancelled','paid')
      ${dateConditions.length ? `AND ${dateConditions.join(' AND ')}` : ''}
    ORDER BY i.due_date ASC, i.balance DESC
    LIMIT 10`,
    dateParams
  );

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

/**
 * Get analytics data for charts
 */
const getAnalytics = async (filters = {}) => {
  const { dateFrom, dateTo, period = 'monthly' } = filters;
  const dateConditions = [];
  const dateParams = [];

  if (dateFrom) {
    dateConditions.push('i.issue_date >= ?');
    dateParams.push(dateFrom);
  }
  if (dateTo) {
    dateConditions.push('i.issue_date <= ?');
    dateParams.push(dateTo + ' 23:59:59');
  }
  const dateWhere = dateConditions.length ? `WHERE ${dateConditions.join(' AND ')}` : '';

  // Monthly invoices vs collections
  const monthlyData = await query(
    `SELECT 
      DATE_FORMAT(i.issue_date, '%Y-%m') as month,
      COALESCE(SUM(i.total_amount), 0) as invoices,
      COALESCE(SUM(CASE WHEN p.status = 'cleared' THEN p.amount ELSE 0 END), 0) as collections
    FROM invoices i
      LEFT JOIN payments p ON p.invoice_id = i.id AND DATE_FORMAT(p.paid_at, '%Y-%m') = DATE_FORMAT(i.issue_date, '%Y-%m')
    ${dateWhere}
    GROUP BY DATE_FORMAT(i.issue_date, '%Y-%m')
    ORDER BY month ASC`,
    dateParams
  );

  // Outstanding trends (by month)
  const outstandingTrends = await query(
    `SELECT 
      DATE_FORMAT(i.issue_date, '%Y-%m') as month,
      COALESCE(SUM(i.balance), 0) as outstanding
    FROM invoices i
    ${dateWhere}
    GROUP BY DATE_FORMAT(i.issue_date, '%Y-%m')
    ORDER BY month ASC`,
    dateParams
  );

  // Realization percentages (collected vs invoiced)
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
    ${dateWhere}
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

/**
 * Get subscription and storage usage
 */
const getSubscriptionUsage = async (userId) => {
  // Get user's subscription
  const [subscription] = await query(
    `SELECT s.*, sp.storage_limit_gb, sp.features
     FROM subscriptions s
     LEFT JOIN subscription_plans sp ON sp.plan_name = s.plan
     WHERE s.user_id = ? OR s.organization_id IN (SELECT organization_id FROM users WHERE id = ?)
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId, userId]
  );

  // Get storage usage
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

