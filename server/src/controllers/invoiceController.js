const { apiSuccess, apiError } = require('../utils/apiResponse');
const invoiceService = require('../services/invoiceService');

const listInvoices = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status, q } = req.query;
    const result = await invoiceService.listInvoices({ page, pageSize, status, q });
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const getInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);
    if (!invoice) return res.status(404).json(apiError('Invoice not found'));
    res.json(apiSuccess(invoice));
  } catch (err) {
    next(err);
  }
};

const listInvoiceLines = async (req, res, next) => {
  try {
    const lines = await invoiceService.listInvoiceLines(req.params.id);
    res.json(apiSuccess(lines));
  } catch (err) {
    next(err);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.createInvoice(req.body, req.user.id);
    res.status(201).json(apiSuccess(invoice, 'Invoice created'));
  } catch (err) {
    if (err.message === 'PO_NOT_APPROVED') {
      return res.status(400).json(apiError('PO must be approved to create invoice', 'ERR_PO_STATUS'));
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(apiError('Invoice number exists', 'ERR_DUPLICATE'));
    }
    next(err);
  }
};

module.exports = { listInvoices, getInvoice, listInvoiceLines, createInvoice };

