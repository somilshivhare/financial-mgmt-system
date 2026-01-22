const { query } = require('../db/query');
const alertsService = require('./alertsService');

/**
 * Check for overdue invoices and generate alerts
 */
const checkOverdueInvoices = async () => {
  try {
    // Find invoices that are overdue (due_date < today and status is 'open' and balance > 0)
    const overdueInvoices = await query(
      `SELECT i.*, c.name AS customer_name
       FROM invoices i
       LEFT JOIN customers c ON c.id = i.customer_id
       WHERE i.status = 'open'
       AND i.due_date < CURDATE()
       AND i.balance > 0
       ORDER BY i.due_date ASC`,
      [],
    );

    for (const invoice of overdueInvoices) {
      // Check if alert already exists for this invoice (to avoid duplicates)
      const existingAlerts = await query(
        `SELECT id FROM alerts 
         WHERE invoice_id = ? 
         AND alert_type = 'invoice_overdue' 
         AND status != 'dismissed'
         AND DATE(created_at) = CURDATE()`,
        [invoice.id],
      );

      // Only create alert if one doesn't exist today
      if (existingAlerts.length === 0) {
        // Get invoice owner or finance role users
        const financeUsers = await query(
          `SELECT id FROM users WHERE role_id = 2 AND status = 'active'`,
          [],
        );

        // Create alert for finance users or invoice creator
        const userIds = financeUsers.map((u) => u.id);
        if (invoice.created_by && !userIds.includes(invoice.created_by)) {
          userIds.push(invoice.created_by);
        }

        // Create alerts for all relevant users
        for (const userId of userIds) {
          await alertsService.createInvoiceOverdueAlert(invoice, userId);
        }
      }
    }

    return { checked: overdueInvoices.length, created: overdueInvoices.length };
  } catch (error) {
    console.error('Error checking overdue invoices:', error);
    throw error;
  }
};

/**
 * Check for overdue collection plans and generate alerts
 */
const checkOverdueCollectionPlans = async () => {
  try {
    // Find collection plans that are overdue (target_date < today and status is 'planned' or 'in_progress')
    const overduePlans = await query(
      `SELECT cp.*, i.invoice_number, i.id AS invoice_id
       FROM collection_plans cp
       LEFT JOIN invoices i ON i.id = cp.invoice_id
       WHERE cp.status IN ('planned', 'in_progress')
       AND cp.target_date < CURDATE()
       ORDER BY cp.target_date ASC`,
      [],
    );

    for (const plan of overduePlans) {
      // Check if alert already exists for this collection plan (to avoid duplicates)
      const existingAlerts = await query(
        `SELECT id FROM alerts 
         WHERE collection_plan_id = ? 
         AND alert_type = 'collection_plan_overdue' 
         AND status != 'dismissed'
         AND DATE(created_at) = CURDATE()`,
        [plan.id],
      );

      // Only create alert if one doesn't exist today
      if (existingAlerts.length === 0) {
        const invoice = { id: plan.invoice_id, invoice_number: plan.invoice_number };
        const userId = plan.owner_user_id;

        await alertsService.createCollectionPlanOverdueAlert(plan, invoice, userId);
      }
    }

    return { checked: overduePlans.length, created: overduePlans.length };
  } catch (error) {
    console.error('Error checking overdue collection plans:', error);
    throw error;
  }
};

/**
 * Check for subscription expiry and generate alerts
 */
const checkSubscriptionExpiry = async () => {
  try {
    // Find subscriptions expiring within 30 days
    const expiringSubscriptions = await query(
      `SELECT * FROM subscriptions
       WHERE status IN ('trial', 'active')
       AND ends_at IS NOT NULL
       AND ends_at BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       ORDER BY ends_at ASC`,
      [],
    );

    for (const subscription of expiringSubscriptions) {
      // Check if alert already exists for this subscription (to avoid duplicates)
      const existingAlerts = await query(
        `SELECT id FROM alerts 
         WHERE alert_type = 'subscription_expiry' 
         AND status != 'dismissed'
         AND DATE(created_at) = CURDATE()`,
        [],
      );

      // Only create alert if one doesn't exist today
      if (existingAlerts.length === 0) {
        // Get all admin users
        const adminUsers = await query(
          `SELECT id FROM users WHERE role_id = 1 AND status = 'active'`,
          [],
        );

        // Create alerts for all admin users
        for (const user of adminUsers) {
          await alertsService.createSubscriptionExpiryAlert(subscription, user.id);
        }
      }
    }

    return { checked: expiringSubscriptions.length, created: expiringSubscriptions.length };
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
    throw error;
  }
};

/**
 * Run all alert generation checks
 */
const runAllChecks = async () => {
  try {
    const results = {
      invoices: await checkOverdueInvoices(),
      collectionPlans: await checkOverdueCollectionPlans(),
      subscriptions: await checkSubscriptionExpiry(),
    };
    return results;
  } catch (error) {
    console.error('Error running alert generation checks:', error);
    throw error;
  }
};

module.exports = {
  checkOverdueInvoices,
  checkOverdueCollectionPlans,
  checkSubscriptionExpiry,
  runAllChecks,
};

