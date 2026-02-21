const { apiSuccess, apiError } = require('../utils/apiResponse');
const reportsService = require('../services/reportsService');

const getSalesReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
      status: req.query.status,
    };
    const result = await reportsService.getSalesReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getPOReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
      status: req.query.status,
    };
    const result = await reportsService.getPOReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getInvoiceReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
      status: req.query.status,
    };
    const result = await reportsService.getInvoiceReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getPaymentReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
      status: req.query.status,
    };
    const result = await reportsService.getPaymentReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getCollectionReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
      status: req.query.status,
    };
    const result = await reportsService.getCollectionReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getOutstandingReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
      status: req.query.status,
    };
    const result = await reportsService.getOutstandingReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getCustomerWiseReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
    };
    const result = await reportsService.getCustomerWiseReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getProjectWiseReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
    };
    const result = await reportsService.getProjectWiseReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getAgingReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
    };
    const result = await reportsService.getAgingReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getTaxGSTReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
    };
    const result = await reportsService.getTaxGSTReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getCommissionReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
    };
    const result = await reportsService.getCommissionReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getReconciliationReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customerId: req.query.customerId,
      businessUnitId: req.query.businessUnitId,
      segmentId: req.query.segmentId,
      regionId: req.query.regionId,
      userId: req.user.id,
      status: req.query.status,
    };
    const result = await reportsService.getReconciliationReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getAuditLogReport = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      userId: req.user.id,
      actionType: req.query.actionType,
    };
    const result = await reportsService.getAuditLogReport(filters);
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getKPIs = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      userId: req.user.id,
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

