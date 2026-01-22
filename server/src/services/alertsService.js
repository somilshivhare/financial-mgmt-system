const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/query');
const websocketService = require('./websocketService');

/**
 * List alerts with pagination, search, and filters
 */
const listAlerts = async (userId, options = {}) => {
  const {
    page = 1,
    pageSize = 20,
    search = '',
    alertType = '',
    status = '',
    severity = '',
    startDate = '',
    endDate = '',
    unreadOnly = false,
  } = options;

  const offset = (page - 1) * pageSize;
  const where = [];
  const params = [];

  // User-specific or global alerts
  where.push('(user_id = ? OR user_id IS NULL)');
  params.push(userId);

  // Status filter
  if (status) {
    where.push('status = ?');
    params.push(status);
  } else if (unreadOnly) {
    where.push('status = ?');
    params.push('new');
  }

  // Alert type filter
  if (alertType) {
    where.push('alert_type = ?');
    params.push(alertType);
  }

  // Severity filter
  if (severity) {
    where.push('severity = ?');
    params.push(severity);
  }

  // Date range filter
  if (startDate) {
    where.push('DATE(created_at) >= ?');
    params.push(startDate);
  }
  if (endDate) {
    where.push('DATE(created_at) <= ?');
    params.push(endDate);
  }

  // Search filter
  if (search) {
    where.push('(message LIKE ? OR alert_type LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Get data
  const data = await query(
    `SELECT a.*,
       i.invoice_number,
       p.reference as payment_reference,
       po.po_number,
       cp.target_date as collection_target_date
     FROM alerts a
     LEFT JOIN invoices i ON a.invoice_id = i.id
     LEFT JOIN payments p ON a.payment_id = p.id
     LEFT JOIN purchase_orders po ON a.po_id = po.id
     LEFT JOIN collection_plans cp ON a.collection_plan_id = cp.id
     ${whereSql}
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(pageSize), Number(offset)],
  );

  // Get total count
  const [{ total }] = await query(
    `SELECT COUNT(*) as total FROM alerts a ${whereSql}`,
    params,
  );

  return {
    data,
    page: Number(page),
    pageSize: Number(pageSize),
    total: Number(total),
  };
};

/**
 * Get unread alerts count for a user
 */
const getUnreadCount = async (userId) => {
  const [{ count }] = await query(
    `SELECT COUNT(*) as count 
     FROM alerts 
     WHERE (user_id = ? OR user_id IS NULL) AND status = 'new'`,
    [userId],
  );
  return Number(count);
};

/**
 * Get alert by ID
 */
const getAlertById = async (id, userId) => {
  const [alert] = await query(
    `SELECT a.*,
       i.invoice_number,
       p.reference as payment_reference,
       po.po_number,
       cp.target_date as collection_target_date
     FROM alerts a
     LEFT JOIN invoices i ON a.invoice_id = i.id
     LEFT JOIN payments p ON a.payment_id = p.id
     LEFT JOIN purchase_orders po ON a.po_id = po.id
     LEFT JOIN collection_plans cp ON a.collection_plan_id = cp.id
     WHERE a.id = ? AND (a.user_id = ? OR a.user_id IS NULL)`,
    [id, userId],
  );
  return alert || null;
};

/**
 * Create an alert
 */
const createAlert = async (payload, createdBy = null) => {
  const id = uuidv4();
  const {
    userId = null,
    alertType,
    message,
    linkUrl = null,
    severity = 'info',
    invoiceId = null,
    paymentId = null,
    poId = null,
    collectionPlanId = null,
  } = payload;

  await query(
    `INSERT INTO alerts (
      id, user_id, alert_type, message, link_url, severity, status,
      invoice_id, payment_id, po_id, collection_plan_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      userId,
      alertType,
      message,
      linkUrl,
      severity,
      invoiceId,
      paymentId,
      poId,
      collectionPlanId,
    ],
  );

  const alert = await getAlertById(id, userId || createdBy || '');

  // Send real-time notification via WebSocket if user_id is specified
  if (userId && alert) {
    websocketService.sendNotificationToUser(userId, {
      type: 'alert',
      ...alert,
    });
  }

  return alert;
};

/**
 * Mark alert as read
 */
const markAsRead = async (id, userId) => {
  await query(
    `UPDATE alerts 
     SET status = 'read', read_at = NOW(), updated_at = NOW()
     WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
    [id, userId],
  );
  return getAlertById(id, userId);
};

/**
 * Mark all alerts as read for a user
 */
const markAllAsRead = async (userId) => {
  await query(
    `UPDATE alerts 
     SET status = 'read', read_at = NOW(), updated_at = NOW()
     WHERE (user_id = ? OR user_id IS NULL) AND status = 'new'`,
    [userId],
  );
  const [{ count }] = await query(
    `SELECT COUNT(*) as count 
     FROM alerts 
     WHERE (user_id = ? OR user_id IS NULL) AND status = 'read'`,
    [userId],
  );
  return { count: Number(count) };
};

/**
 * Dismiss an alert
 */
const dismissAlert = async (id, userId) => {
  await query(
    `UPDATE alerts 
     SET status = 'dismissed', updated_at = NOW()
     WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
    [id, userId],
  );
  return getAlertById(id, userId);
};

/**
 * Alert generation functions for different workflows
 */

// Invoice overdue alert
const createInvoiceOverdueAlert = async (invoice, userId = null) => {
  const daysOverdue = Math.floor(
    (new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24),
  );
  const severity = daysOverdue > 30 ? 'critical' : daysOverdue > 15 ? 'warning' : 'info';

  return createAlert({
    userId,
    alertType: 'invoice_overdue',
    message: `Invoice ${invoice.invoice_number} is overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}. Collection follow-up is recommended.`,
    linkUrl: `/invoices/${invoice.id}`,
    severity,
    invoiceId: invoice.id,
  });
};

// Payment received alert
const createPaymentReceivedAlert = async (payment, invoice, userId = null) => {
  return createAlert({
    userId,
    alertType: 'payment_received',
    message: `Payment of ${payment.amount} received for invoice ${invoice.invoice_number}.`,
    linkUrl: `/payments`,
    severity: 'info',
    paymentId: payment.id,
    invoiceId: invoice.id,
  });
};

// Invoice pending approval alert
const createInvoicePendingApprovalAlert = async (invoice, approverUserId) => {
  return createAlert({
    userId: approverUserId,
    alertType: 'invoice_pending_approval',
    message: `Invoice ${invoice.invoice_number} is pending your approval.`,
    linkUrl: `/invoices/${invoice.id}`,
    severity: 'warning',
    invoiceId: invoice.id,
  });
};

// Master data update required alert
const createMasterDataUpdateRequiredAlert = async (entityType, entityId, userId = null) => {
  return createAlert({
    userId,
    alertType: 'master_data_update_required',
    message: `Master data update required for ${entityType}. Please review and update.`,
    linkUrl: `/master-data`,
    severity: 'warning',
  });
};

// Collection plan overdue alert
const createCollectionPlanOverdueAlert = async (collectionPlan, invoice, userId = null) => {
  const daysOverdue = Math.floor(
    (new Date() - new Date(collectionPlan.target_date)) / (1000 * 60 * 60 * 24),
  );
  const severity = daysOverdue > 7 ? 'critical' : 'warning';

  return createAlert({
    userId,
    alertType: 'collection_plan_overdue',
    message: `Collection plan for invoice ${invoice.invoice_number} is overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}.`,
    linkUrl: `/collection-plans/${collectionPlan.id}`,
    severity,
    collectionPlanId: collectionPlan.id,
    invoiceId: invoice.id,
  });
};

// Subscription expiry alert
const createSubscriptionExpiryAlert = async (subscription, userId = null) => {
  const daysUntilExpiry = Math.floor(
    (new Date(subscription.ends_at) - new Date()) / (1000 * 60 * 60 * 24),
  );
  const severity = daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 30 ? 'warning' : 'info';

  return createAlert({
    userId,
    alertType: 'subscription_expiry',
    message: `Your subscription will expire in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}. Please renew to continue service.`,
    linkUrl: `/subscription`,
    severity,
  });
};

// Failed action alert
const createFailedActionAlert = async (actionType, errorMessage, userId = null) => {
  return createAlert({
    userId,
    alertType: 'action_failed',
    message: `Action failed: ${actionType}. ${errorMessage}`,
    linkUrl: null,
    severity: 'warning',
  });
};

module.exports = {
  listAlerts,
  getUnreadCount,
  getAlertById,
  createAlert,
  markAsRead,
  markAllAsRead,
  dismissAlert,
  // Alert generation functions
  createInvoiceOverdueAlert,
  createPaymentReceivedAlert,
  createInvoicePendingApprovalAlert,
  createMasterDataUpdateRequiredAlert,
  createCollectionPlanOverdueAlert,
  createSubscriptionExpiryAlert,
  createFailedActionAlert,
};
