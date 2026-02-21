const { query } = require('../db/query');

const buildDateFilter = (dateFrom, dateTo, dateField = 'created_at') => {
  const conditions = [];
  const params = [];
  if (dateFrom) {
    conditions.push(`${dateField} >= ?`);
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push(`${dateField} <= ?`);
    params.push(dateTo + ' 23:59:59');
  }
  return { conditions, params };
};

const buildCommonFilters = (filters) => {
  const conditions = [];
  const params = [];
  const {
    dateFrom,
    dateTo,
    customerId,
    projectId,
    businessUnitId,
    segmentId,
    regionId,
    userId,
    status,
    dateField = 'created_at',
    tablePrefix = '', // e.g., 'i.' for invoices, 'po.' for purchase_orders
  } = filters;

  const dateFilter = buildDateFilter(dateFrom, dateTo, dateField);
  conditions.push(...dateFilter.conditions);
  params.push(...dateFilter.params);

  if (customerId) {
    if (tablePrefix) {
      conditions.push(`${tablePrefix}customer_id = ?`);
    } else {
      conditions.push('customer_id = ?');
    }
    params.push(customerId);
  }

  if (projectId) {
    if (tablePrefix) {
      conditions.push(`${tablePrefix}project_id = ?`);
    } else {
      conditions.push('project_id = ?');
    }
    params.push(projectId);
  }

  if (businessUnitId) {
    conditions.push('c.business_unit_id = ?');
    params.push(businessUnitId);
  }

  if (segmentId) {
    conditions.push('c.segment_id = ?');
    params.push(segmentId);
  }

  if (regionId) {
    conditions.push('c.region_id = ?');
    params.push(regionId);
  }

  if (userId) {
    if (tablePrefix) {
      conditions.push(`${tablePrefix}created_by = ?`);
    } else {
      conditions.push('created_by = ?');
    }
    params.push(userId);
  }

  if (status) {
    if (tablePrefix) {
      conditions.push(`${tablePrefix}status = ?`);
    } else {
      conditions.push('status = ?');
    }
    params.push(status);
  }

  return { conditions, params };
};

const getSalesReport = async (filters = {}) => {
  try {
    const { conditions, params } = buildCommonFilters({ ...filters, dateField: 'i.issue_date', tablePrefix: 'i.' });
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const salesData = await query(
    `SELECT 
      i.id,
      i.invoice_number,
      i.issue_date,
      i.due_date,
      i.customer_id,
      c.name AS customer_name,
      c.business_unit_id,
      bu.name AS business_unit_name,
      c.segment_id,
      s.name AS segment_name,
      c.region_id,
      r.name AS region_name,
      i.status,
      i.subtotal,
      i.total_gst,
      i.total_amount,
      i.amount_paid,
      i.balance,
      i.currency,
      u.full_name AS created_by_name
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    LEFT JOIN business_units bu ON bu.id = c.business_unit_id
    LEFT JOIN segments s ON s.id = c.segment_id
    LEFT JOIN regions r ON r.id = c.region_id
    LEFT JOIN users u ON u.id = i.created_by
    ${whereClause}
    ORDER BY i.issue_date DESC`,
    params
  );

    const summary = salesData.reduce(
      (acc, row) => {
        acc.totalInvoices += 1;
        acc.totalAmount += parseFloat(row.total_amount || 0);
        acc.totalGST += parseFloat(row.total_gst || 0);
        acc.totalPaid += parseFloat(row.amount_paid || 0);
        acc.totalBalance += parseFloat(row.balance || 0);
        return acc;
      },
      { totalInvoices: 0, totalAmount: 0, totalGST: 0, totalPaid: 0, totalBalance: 0 }
    );

    return { data: salesData || [], summary };
  } catch (err) {
    console.error('[Reports Service] Error getting sales report:', err.message);
    return {
      data: [],
      summary: { totalInvoices: 0, totalAmount: 0, totalGST: 0, totalPaid: 0, totalBalance: 0 }
    };
  }
};

const getPOReport = async (filters = {}) => {
  const { conditions, params } = buildCommonFilters({ ...filters, dateField: 'po.issue_date', tablePrefix: 'po.' });
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const poData = await query(
    `SELECT 
      po.id,
      po.po_number,
      po.issue_date,
      po.due_date,
      po.customer_id,
      c.name AS customer_name,
      c.business_unit_id,
      bu.name AS business_unit_name,
      c.segment_id,
      s.name AS segment_name,
      c.region_id,
      r.name AS region_name,
      po.status,
      po.total_amount,
      po.currency,
      u.full_name AS created_by_name,
      (SELECT COUNT(*) FROM invoices i WHERE i.po_id = po.id) AS invoice_count
    FROM purchase_orders po
    LEFT JOIN customers c ON c.id = po.customer_id
    LEFT JOIN business_units bu ON bu.id = c.business_unit_id
    LEFT JOIN segments s ON s.id = c.segment_id
    LEFT JOIN regions r ON r.id = c.region_id
    LEFT JOIN users u ON u.id = po.created_by
    ${whereClause}
    ORDER BY po.issue_date DESC`,
    params
  );

  const summary = poData.reduce(
    (acc, row) => {
      acc.totalPOs += 1;
      acc.totalAmount += parseFloat(row.total_amount || 0);
      if (row.status === 'approved') acc.approvedAmount += parseFloat(row.total_amount || 0);
      if (row.status === 'closed') acc.closedAmount += parseFloat(row.total_amount || 0);
      return acc;
    },
    { totalPOs: 0, totalAmount: 0, approvedAmount: 0, closedAmount: 0 }
  );

  return { data: poData, summary };
};

const getInvoiceReport = async (filters = {}) => {
  return getSalesReport(filters); // Same as sales report
};

const getPaymentReport = async (filters = {}) => {
  const conditions = [];
  const params = [];
  const dateFilter = buildDateFilter(filters.dateFrom, filters.dateTo, 'p.paid_at');
  conditions.push(...dateFilter.conditions);
  params.push(...dateFilter.params);
  
  if (filters.customerId) {
    conditions.push('i.customer_id = ?');
    params.push(filters.customerId);
  }
  if (filters.businessUnitId) {
    conditions.push('c.business_unit_id = ?');
    params.push(filters.businessUnitId);
  }
  if (filters.segmentId) {
    conditions.push('c.segment_id = ?');
    params.push(filters.segmentId);
  }
  if (filters.regionId) {
    conditions.push('c.region_id = ?');
    params.push(filters.regionId);
  }
  if (filters.userId) {
    conditions.push('p.created_by = ?');
    params.push(filters.userId);
  }
  if (filters.status) {
    conditions.push('p.status = ?');
    params.push(filters.status);
  }
  
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const paymentData = await query(
    `SELECT 
      p.id,
      p.invoice_id,
      i.invoice_number,
      p.payment_advice_id,
      pa.advice_number,
      p.amount,
      p.method,
      p.reference,
      p.paid_at,
      p.status,
      p.tds,
      p.bank_charges,
      p.penalty,
      p.other_deductions,
      i.customer_id,
      c.name AS customer_name,
      c.business_unit_id,
      bu.name AS business_unit_name,
      u.full_name AS created_by_name
    FROM payments p
    LEFT JOIN invoices i ON i.id = p.invoice_id
    LEFT JOIN payment_advices pa ON pa.id = p.payment_advice_id
    LEFT JOIN customers c ON c.id = i.customer_id
    LEFT JOIN business_units bu ON bu.id = c.business_unit_id
    LEFT JOIN users u ON u.id = p.created_by
    ${whereClause}
    ORDER BY p.paid_at DESC`,
    params
  );

  const summary = paymentData.reduce(
    (acc, row) => {
      acc.totalPayments += 1;
      acc.totalAmount += parseFloat(row.amount || 0);
      acc.totalTDS += parseFloat(row.tds || 0);
      acc.totalDeductions +=
        parseFloat(row.tds || 0) +
        parseFloat(row.bank_charges || 0) +
        parseFloat(row.penalty || 0) +
        parseFloat(row.other_deductions || 0);
      return acc;
    },
    { totalPayments: 0, totalAmount: 0, totalTDS: 0, totalDeductions: 0 }
  );

  return { data: paymentData, summary };
};

const getCollectionReport = async (filters = {}) => {
  const conditions = [];
  const params = [];
  const dateFilter = buildDateFilter(filters.dateFrom, filters.dateTo, 'cp.target_date');
  conditions.push(...dateFilter.conditions);
  params.push(...dateFilter.params);
  
  if (filters.customerId) {
    conditions.push('i.customer_id = ?');
    params.push(filters.customerId);
  }
  if (filters.businessUnitId) {
    conditions.push('c.business_unit_id = ?');
    params.push(filters.businessUnitId);
  }
  if (filters.segmentId) {
    conditions.push('c.segment_id = ?');
    params.push(filters.segmentId);
  }
  if (filters.regionId) {
    conditions.push('c.region_id = ?');
    params.push(filters.regionId);
  }
  if (filters.userId) {
    conditions.push('cp.owner_user_id = ?');
    params.push(filters.userId);
  }
  if (filters.status) {
    conditions.push('cp.status = ?');
    params.push(filters.status);
  }
  
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const collectionData = await query(
    `SELECT 
      cp.id,
      cp.invoice_id,
      i.invoice_number,
      i.customer_id,
      c.name AS customer_name,
      cp.target_date,
      cp.expected_amount,
      cp.status,
      cp.notes,
      i.total_amount AS invoice_amount,
      i.amount_paid,
      i.balance,
      u.full_name AS owner_name
    FROM collection_plans cp
    LEFT JOIN invoices i ON i.id = cp.invoice_id
    LEFT JOIN customers c ON c.id = i.customer_id
    LEFT JOIN users u ON u.id = cp.owner_user_id
    ${whereClause}
    ORDER BY cp.target_date DESC`,
    params
  );

  const summary = collectionData.reduce(
    (acc, row) => {
      acc.totalPlans += 1;
      acc.totalExpected += parseFloat(row.expected_amount || 0);
      if (row.status === 'done') acc.collectedAmount += parseFloat(row.expected_amount || 0);
      return acc;
    },
    { totalPlans: 0, totalExpected: 0, collectedAmount: 0 }
  );

  return { data: collectionData, summary };
};

const getOutstandingReport = async (filters = {}) => {
  const { conditions, params } = buildCommonFilters({ ...filters, tablePrefix: 'i.' });
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const outstandingData = await query(
    `SELECT 
      i.id,
      i.invoice_number,
      i.issue_date,
      i.due_date,
      i.customer_id,
      c.name AS customer_name,
      c.business_unit_id,
      bu.name AS business_unit_name,
      i.status,
      i.total_amount,
      i.amount_paid,
      i.balance,
      DATEDIFF(CURDATE(), i.due_date) AS days_overdue,
      CASE 
        WHEN i.balance > 0 AND i.due_date < CURDATE() THEN 'overdue'
        WHEN i.balance > 0 AND i.due_date >= CURDATE() THEN 'outstanding'
        ELSE 'paid'
      END AS payment_status
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    LEFT JOIN business_units bu ON bu.id = c.business_unit_id
    ${whereClause}
    HAVING payment_status IN ('outstanding', 'overdue')
    ORDER BY i.due_date ASC, i.balance DESC`,
    params
  );

  const summary = outstandingData.reduce(
    (acc, row) => {
      acc.totalOutstanding += parseFloat(row.balance || 0);
      if (row.payment_status === 'overdue') {
        acc.totalOverdue += parseFloat(row.balance || 0);
        acc.overdueCount += 1;
      } else {
        acc.outstandingCount += 1;
      }
      return acc;
    },
    { totalOutstanding: 0, totalOverdue: 0, overdueCount: 0, outstandingCount: 0 }
  );

  return { data: outstandingData, summary };
};

const getCustomerWiseReport = async (filters = {}) => {
  const conditions = [];
  const params = [];
  const dateFilter = buildDateFilter(filters.dateFrom, filters.dateTo, 'i.issue_date');
  if (dateFilter.conditions.length > 0) {
    conditions.push(...dateFilter.conditions);
    params.push(...dateFilter.params);
  }
  
  if (filters.customerId) {
    conditions.push('c.id = ?');
    params.push(filters.customerId);
  }
  if (filters.businessUnitId) {
    conditions.push('c.business_unit_id = ?');
    params.push(filters.businessUnitId);
  }
  if (filters.segmentId) {
    conditions.push('c.segment_id = ?');
    params.push(filters.segmentId);
  }
  if (filters.regionId) {
    conditions.push('c.region_id = ?');
    params.push(filters.regionId);
  }
  if (filters.userId) {
    conditions.push('i.created_by = ?');
    params.push(filters.userId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const poJoinCondition = filters.userId ? ' AND po.created_by = ?' : '';
  const poJoinParams = filters.userId ? [filters.userId] : [];

  const customerData = await query(
    `SELECT 
      c.id AS customer_id,
      c.name AS customer_name,
      c.business_unit_id,
      bu.name AS business_unit_name,
      c.segment_id,
      s.name AS segment_name,
      c.region_id,
      r.name AS region_name,
      COUNT(DISTINCT i.id) AS invoice_count,
      COUNT(DISTINCT po.id) AS po_count,
      SUM(i.total_amount) AS total_invoiced,
      SUM(i.amount_paid) AS total_paid,
      SUM(i.balance) AS total_balance,
      SUM(CASE WHEN i.due_date < CURDATE() AND i.balance > 0 THEN i.balance ELSE 0 END) AS overdue_amount
    FROM customers c
    LEFT JOIN invoices i ON i.customer_id = c.id ${whereClause.replace('WHERE', 'AND')}
    LEFT JOIN purchase_orders po ON po.customer_id = c.id${poJoinCondition}
    LEFT JOIN business_units bu ON bu.id = c.business_unit_id
    LEFT JOIN segments s ON s.id = c.segment_id
    LEFT JOIN regions r ON r.id = c.region_id
    ${whereClause.includes('customer_id') ? whereClause : ''}
    GROUP BY c.id, c.name, c.business_unit_id, bu.name, c.segment_id, s.name, c.region_id, r.name
    ORDER BY total_invoiced DESC`,
    [...params, ...poJoinParams]
  );

  const summary = customerData.reduce(
    (acc, row) => {
      acc.totalCustomers += 1;
      acc.totalInvoiced += parseFloat(row.total_invoiced || 0);
      acc.totalPaid += parseFloat(row.total_paid || 0);
      acc.totalBalance += parseFloat(row.total_balance || 0);
      acc.totalOverdue += parseFloat(row.overdue_amount || 0);
      return acc;
    },
    { totalCustomers: 0, totalInvoiced: 0, totalPaid: 0, totalBalance: 0, totalOverdue: 0 }
  );

  return { data: customerData, summary };
};

const getProjectWiseReport = async (filters = {}) => {
  return getCustomerWiseReport(filters);
};

const getAgingReport = async (filters = {}) => {
  const { conditions, params } = buildCommonFilters({ ...filters, tablePrefix: 'i.' });
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const agingData = await query(
    `SELECT 
      i.id,
      i.invoice_number,
      i.issue_date,
      i.due_date,
      i.customer_id,
      c.name AS customer_name,
      c.business_unit_id,
      bu.name AS business_unit_name,
      i.balance,
      DATEDIFF(CURDATE(), i.due_date) AS days_overdue,
      CASE 
        WHEN i.balance <= 0 THEN 0
        WHEN DATEDIFF(CURDATE(), i.due_date) <= 30 THEN i.balance
        ELSE 0
      END AS age_0_30,
      CASE 
        WHEN i.balance <= 0 THEN 0
        WHEN DATEDIFF(CURDATE(), i.due_date) > 30 AND DATEDIFF(CURDATE(), i.due_date) <= 60 THEN i.balance
        ELSE 0
      END AS age_31_60,
      CASE 
        WHEN i.balance <= 0 THEN 0
        WHEN DATEDIFF(CURDATE(), i.due_date) > 60 AND DATEDIFF(CURDATE(), i.due_date) <= 90 THEN i.balance
        ELSE 0
      END AS age_61_90,
      CASE 
        WHEN i.balance <= 0 THEN 0
        WHEN DATEDIFF(CURDATE(), i.due_date) > 90 THEN i.balance
        ELSE 0
      END AS age_90_plus
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    LEFT JOIN business_units bu ON bu.id = c.business_unit_id
    ${whereClause}
    HAVING balance > 0
    ORDER BY days_overdue DESC, i.balance DESC`,
    params
  );

  const summary = agingData.reduce(
    (acc, row) => {
      acc.totalOutstanding += parseFloat(row.balance || 0);
      acc.age0_30 += parseFloat(row.age_0_30 || 0);
      acc.age31_60 += parseFloat(row.age_31_60 || 0);
      acc.age61_90 += parseFloat(row.age_61_90 || 0);
      acc.age90Plus += parseFloat(row.age_90_plus || 0);
      return acc;
    },
    { totalOutstanding: 0, age0_30: 0, age31_60: 0, age61_90: 0, age90Plus: 0 }
  );

  return { data: agingData, summary };
};

const getTaxGSTReport = async (filters = {}) => {
  const { conditions, params } = buildCommonFilters({ ...filters, dateField: 'i.issue_date', tablePrefix: 'i.' });
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const taxData = await query(
    `SELECT 
      i.id,
      i.invoice_number,
      i.issue_date,
      i.customer_id,
      c.name AS customer_name,
      i.basic_value,
      i.freight_value,
      i.sgst_rate,
      i.sgst_value,
      i.cgst_rate,
      i.cgst_value,
      i.igst_rate,
      i.igst_value,
      i.ugst_rate,
      i.ugst_value,
      i.total_gst,
      i.tcs,
      i.subtotal,
      i.total_amount
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    ${whereClause}
    ORDER BY i.issue_date DESC`,
    params
  );

  const summary = taxData.reduce(
    (acc, row) => {
      acc.totalBasicValue += parseFloat(row.basic_value || 0);
      acc.totalFreightValue += parseFloat(row.freight_value || 0);
      acc.totalSGST += parseFloat(row.sgst_value || 0);
      acc.totalCGST += parseFloat(row.cgst_value || 0);
      acc.totalIGST += parseFloat(row.igst_value || 0);
      acc.totalUGST += parseFloat(row.ugst_value || 0);
      acc.totalGST += parseFloat(row.total_gst || 0);
      acc.totalTCS += parseFloat(row.tcs || 0);
      acc.totalAmount += parseFloat(row.total_amount || 0);
      return acc;
    },
    {
      totalBasicValue: 0,
      totalFreightValue: 0,
      totalSGST: 0,
      totalCGST: 0,
      totalIGST: 0,
      totalUGST: 0,
      totalGST: 0,
      totalTCS: 0,
      totalAmount: 0,
    }
  );

  return { data: taxData, summary };
};

const getCommissionReport = async (filters = {}) => {
  const { conditions, params } = buildCommonFilters({ ...filters, dateField: 'i.issue_date', tablePrefix: 'i.' });
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const commissionData = await query(
    `SELECT 
      u.id AS user_id,
      u.full_name AS user_name,
      u.email,
      COUNT(DISTINCT i.id) AS invoices_created,
      SUM(i.total_amount) AS sales_amount,
      SUM(i.amount_paid) AS collection_amount,
      COUNT(DISTINCT p.id) AS payments_processed,
      SUM(p.amount) AS payment_amount
    FROM users u
    LEFT JOIN invoices i ON i.created_by = u.id ${whereClause.replace('WHERE', 'AND')}
    LEFT JOIN payments p ON p.created_by = u.id
    GROUP BY u.id, u.full_name, u.email
    HAVING invoices_created > 0 OR payments_processed > 0
    ORDER BY sales_amount DESC`,
    params
  );

  const summary = commissionData.reduce(
    (acc, row) => {
      acc.totalUsers += 1;
      acc.totalSales += parseFloat(row.sales_amount || 0);
      acc.totalCollections += parseFloat(row.collection_amount || 0);
      acc.totalCommission +=
        parseFloat(row.sales_amount || 0) * 0.02 + parseFloat(row.collection_amount || 0) * 0.01;
      return acc;
    },
    { totalUsers: 0, totalSales: 0, totalCollections: 0, totalCommission: 0 }
  );

  return { data: commissionData, summary };
};

const getReconciliationReport = async (filters = {}) => {
  const conditions = [];
  const params = [];
  const dateFilter = buildDateFilter(filters.dateFrom, filters.dateTo, 'p.paid_at');
  conditions.push(...dateFilter.conditions);
  params.push(...dateFilter.params);
  
  if (filters.customerId) {
    conditions.push('i.customer_id = ?');
    params.push(filters.customerId);
  }
  if (filters.businessUnitId) {
    conditions.push('c.business_unit_id = ?');
    params.push(filters.businessUnitId);
  }
  if (filters.segmentId) {
    conditions.push('c.segment_id = ?');
    params.push(filters.segmentId);
  }
  if (filters.regionId) {
    conditions.push('c.region_id = ?');
    params.push(filters.regionId);
  }
  if (filters.userId) {
    conditions.push('p.created_by = ?');
    params.push(filters.userId);
  }
  if (filters.status) {
    conditions.push('p.status = ?');
    params.push(filters.status);
  }
  
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const reconciliationData = await query(
    `SELECT 
      p.id,
      p.payment_advice_id,
      pa.advice_number,
      pa.received_at,
      p.invoice_id,
      i.invoice_number,
      p.amount,
      p.method,
      p.reference,
      p.paid_at,
      p.status,
      p.tds,
      p.bank_charges,
      p.penalty,
      p.other_deductions,
      (p.amount - p.tds - p.bank_charges - p.penalty - p.other_deductions) AS net_amount,
      i.customer_id,
      c.name AS customer_name
    FROM payments p
    LEFT JOIN payment_advices pa ON pa.id = p.payment_advice_id
    LEFT JOIN invoices i ON i.id = p.invoice_id
    LEFT JOIN customers c ON c.id = i.customer_id
    ${whereClause}
    ORDER BY p.paid_at DESC`,
    params
  );

  const summary = reconciliationData.reduce(
    (acc, row) => {
      acc.totalPayments += 1;
      acc.totalAmount += parseFloat(row.amount || 0);
      acc.totalDeductions +=
        parseFloat(row.tds || 0) +
        parseFloat(row.bank_charges || 0) +
        parseFloat(row.penalty || 0) +
        parseFloat(row.other_deductions || 0);
      acc.totalNetAmount += parseFloat(row.net_amount || 0);
      if (row.status === 'cleared') acc.clearedAmount += parseFloat(row.amount || 0);
      if (row.status === 'pending') acc.pendingAmount += parseFloat(row.amount || 0);
      return acc;
    },
    {
      totalPayments: 0,
      totalAmount: 0,
      totalDeductions: 0,
      totalNetAmount: 0,
      clearedAmount: 0,
      pendingAmount: 0,
    }
  );

  return { data: reconciliationData, summary };
};

const getAuditLogReport = async (filters = {}) => {
  const { dateFrom, dateTo, userId, actionType } = filters;
  const conditions = [];
  const params = [];

  if (dateFrom) {
    conditions.push('ual.created_at >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('ual.created_at <= ?');
    params.push(dateTo + ' 23:59:59');
  }
  if (userId) {
    conditions.push('ual.user_id = ?');
    params.push(userId);
  }
  if (actionType) {
    conditions.push('ual.action_type = ?');
    params.push(actionType);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const auditData = await query(
    `SELECT 
      ual.id,
      ual.user_id,
      u.full_name AS user_name,
      u.email,
      ual.action_type,
      ual.action_description,
      ual.resource_type,
      ual.resource_id,
      ual.ip_address,
      ual.user_agent,
      ual.metadata,
      ual.created_at
    FROM user_activity_log ual
    LEFT JOIN users u ON u.id = ual.user_id
    ${whereClause}
    ORDER BY ual.created_at DESC
    LIMIT 10000`,
    params
  );

  const summary = auditData.reduce(
    (acc, row) => {
      acc.totalActions += 1;
      if (!acc.actionsByType[row.action_type]) {
        acc.actionsByType[row.action_type] = 0;
      }
      acc.actionsByType[row.action_type] += 1;
      return acc;
    },
    { totalActions: 0, actionsByType: {} }
  );

  return { data: auditData, summary };
};

const getKPIs = async (filters = {}) => {
  try {
    const { dateFrom, dateTo, userId } = filters;
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
    if (userId) {
      dateConditions.push('i.created_by = ?');
      dateParams.push(userId);
    }
    const dateWhere = dateConditions.length ? `WHERE ${dateConditions.join(' AND ')}` : '';

    const poWhere = dateWhere
      .replace(/i\.issue_date/g, 'po.issue_date')
      .replace('i.created_by', 'po.created_by')
      .replace('FROM invoices', 'FROM purchase_orders po')
      .replace('FROM invoices', 'FROM purchase_orders po');
    const payWhere = dateWhere
      .replace(/i\.issue_date/g, 'p.paid_at')
      .replace('i.created_by', 'p.created_by')
      .replace('FROM invoices', 'FROM payments p');

    const kpiData = await query(
      `SELECT 
        (SELECT COUNT(*) FROM invoices i ${dateWhere}) AS total_invoices,
        (SELECT COALESCE(SUM(i.total_amount), 0) FROM invoices i ${dateWhere}) AS total_invoiced,
        (SELECT COALESCE(SUM(i.amount_paid), 0) FROM invoices i ${dateWhere}) AS total_collected,
        (SELECT COALESCE(SUM(i.balance), 0) FROM invoices i ${dateWhere}) AS total_outstanding,
        (SELECT COALESCE(SUM(i.balance), 0) FROM invoices i ${dateWhere} AND i.due_date < CURDATE() AND i.balance > 0) AS total_overdue,
        (SELECT COUNT(*) FROM purchase_orders po ${poWhere}) AS total_pos,
        (SELECT COUNT(*) FROM payments p ${payWhere}) AS total_payments
      `,
      [...dateParams, ...dateParams, ...dateParams, ...dateParams, ...dateParams, ...dateParams, ...dateParams]
    );

    return kpiData && kpiData[0] ? kpiData[0] : {
      total_invoices: 0,
      total_invoiced: 0,
      total_collected: 0,
      total_outstanding: 0,
      total_overdue: 0,
      total_pos: 0,
      total_payments: 0
    };
  } catch (err) {
    console.error('[Reports Service] Error getting KPIs:', err.message);
    return {
      total_invoices: 0,
      total_invoiced: 0,
      total_collected: 0,
      total_outstanding: 0,
      total_overdue: 0,
      total_pos: 0,
      total_payments: 0
    };
  }
};

module.exports = {
  getSalesReport,
  getPOReport,
  getInvoiceReport,
  getPaymentReport,
  getCollectionReport,
  getOutstandingReport,
  getCustomerWiseReport,
  getProjectWiseReport,
  getAgingReport,
  getTaxGSTReport,
  getCommissionReport,
  getReconciliationReport,
  getAuditLogReport,
  getKPIs,
};

