const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const {
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
} = require('../../controllers/reportsController');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Role-based access: Admin and User can view reports (user sees only their own data)
const canViewReports = requireRole('admin', 'user');

// KPIs endpoint
router.get('/kpis', canViewReports, getKPIs);

// Report endpoints
router.get('/sales', canViewReports, getSalesReport);
router.get('/purchase-orders', canViewReports, getPOReport);
router.get('/invoices', canViewReports, getInvoiceReport);
router.get('/payments', canViewReports, getPaymentReport);
router.get('/collections', canViewReports, getCollectionReport);
router.get('/outstanding', canViewReports, getOutstandingReport);
router.get('/customers', canViewReports, getCustomerWiseReport);
router.get('/projects', canViewReports, getProjectWiseReport);
router.get('/aging', canViewReports, getAgingReport);
router.get('/tax-gst', canViewReports, getTaxGSTReport);
router.get('/commissions', canViewReports, getCommissionReport);
router.get('/reconciliation', canViewReports, getReconciliationReport);

// Audit log - Admin only
router.get('/audit-log', requireRole('admin'), getAuditLogReport);

module.exports = router;

