const { apiSuccess, apiError } = require('../utils/apiResponse');
const invoiceService = require('../services/invoiceService');

const listInvoices = async (req, res, next) => {
  try {
    const { page, pageSize, status, q, keyId } = req.query;
    // Parse pagination params to integers (service will validate and default if needed)
    const result = await invoiceService.listInvoices({ 
      page: page ? parseInt(page, 10) : 1, 
      pageSize: pageSize ? parseInt(pageSize, 10) : 20, 
      status, 
      q,
      keyId
    });
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

const getInvoicesByPONumber = async (req, res, next) => {
  try {
    const invoices = await invoiceService.getInvoicesByPONumber(req.params.poNumber);
    res.json(apiSuccess(invoices));
  } catch (err) {
    next(err);
  }
};

const getNextInvoiceNumber = async (req, res, next) => {
  try {
    const { invoiceType = 'REG', businessUnit = 'MAIN' } = req.query;
    const nextNumber = await invoiceService.getNextInvoiceNumber(invoiceType, businessUnit);
    res.json(apiSuccess(nextNumber));
  } catch (err) {
    next(err);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.createInvoice(req.body, req.user.id);
    res.status(201).json(apiSuccess(invoice, 'Invoice created'));
  } catch (err) {
    if (err.message === 'PO_NOT_FOUND') {
      return res.status(400).json(apiError('Purchase Order not found for the given Key ID', 'ERR_PO_NOT_FOUND'));
    }
    if (err.message === 'PO_NOT_APPROVED') {
      return res.status(400).json(apiError('PO must be approved to create invoice', 'ERR_PO_STATUS'));
    }
    if (err.code === 'ERR_CUSTOMER_REQUIRED') {
      return res.status(400).json(apiError(err.message || 'Customer is required. Please select a valid Key ID (PO).', 'ERR_CUSTOMER_REQUIRED'));
    }
    if (err.code === 'ERR_CUSTOMER_NOT_FOUND') {
      return res.status(400).json(apiError(err.message || 'The selected customer is invalid or was not found. Please choose a valid Key ID (PO) and try again.', 'ERR_CUSTOMER_NOT_FOUND'));
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(apiError('Invoice number already exists', 'ERR_DUPLICATE'));
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage && err.sqlMessage.includes('fk_inv_customer')) {
      return res.status(400).json(apiError(
        'The selected customer is invalid or was not found. Please choose a valid Key ID (PO) linked to a customer and try again.',
        'ERR_CUSTOMER_NOT_FOUND'
      ));
    }
    next(err);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.updateInvoice(req.params.id, req.body, req.user.id);
    if (!invoice) return res.status(404).json(apiError('Invoice not found'));
    res.json(apiSuccess(invoice, 'Invoice updated'));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(apiError('Invoice number already exists', 'ERR_DUPLICATE'));
    }
    next(err);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const result = await invoiceService.deleteInvoice(req.params.id, req.user.id);
    res.json(apiSuccess(result, 'Invoice deleted successfully'));
  } catch (err) {
    if (err.message === 'INVOICE_NOT_FOUND') {
      return res.status(404).json(apiError('Invoice not found', 'ERR_NOT_FOUND'));
    }
    if (err.message === 'INVOICE_HAS_PAYMENTS') {
      return res.status(400).json(apiError(
        'Cannot delete invoice with existing payments. Please delete payments first or contact administrator.',
        'ERR_INVOICE_HAS_PAYMENTS'
      ));
    }
    next(err);
  }
};

module.exports = { 
  listInvoices, 
  getInvoice, 
  listInvoiceLines, 
  createInvoice, 
  updateInvoice, 
  deleteInvoice,
  getInvoicesByPONumber, 
  getNextInvoiceNumber 
};

