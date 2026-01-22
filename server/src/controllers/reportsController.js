const { apiSuccess, apiError } = require('../utils/apiResponse');
const reportsService = require('../services/reportsService');

/**
 * Get Sales Report
 */
const getSalesReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
      status: req.query.status,
    };
    const result = await reportsService.getSalesReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Purchase Order Report
 */
const getPOReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
      status: req.query.status,
    };
    const result = await reportsService.getPOReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Invoice Report
 */
const getInvoiceReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
      status: req.query.status,
    };
    const result = await reportsService.getInvoiceReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Payment Report
 */
const getPaymentReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
      status: req.query.status,
    };
    const result = await reportsService.getPaymentReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Collection Report
 */
const getCollectionReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
      status: req.query.status,
    };
    const result = await reportsService.getCollectionReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Outstanding & Overdue Report
 */
const getOutstandingReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
      status: req.query.status,
    };
    const result = await reportsService.getOutstandingReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Customer-wise Report
 */
const getCustomerWiseReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
    };
    const result = await reportsService.getCustomerWiseReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Project-wise Report
 */
const getProjectWiseReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
    };
    const result = await reportsService.getProjectWiseReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Aging Report
 */
const getAgingReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
    };
    const result = await reportsService.getAgingReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Tax & GST Report
 */
const getTaxGSTReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
    };
    const result = await reportsService.getTaxGSTReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Commission Report
 */
const getCommissionReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
    };
    const result = await reportsService.getCommissionReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Reconciliation Report
 */
const getReconciliationReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.query.userId,
      status: req.query.status,
    };
    const result = await reportsService.getReconciliationReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get Audit Log Report
 */
const getAuditLogReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      userId: req.query.userId,
      actionType: req.query.actionType,
    };
    const result = await reportsService.getAuditLogReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get KPIs
 */
const getKPIs = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };
    const result = await reportsService.getKPIs(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
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

