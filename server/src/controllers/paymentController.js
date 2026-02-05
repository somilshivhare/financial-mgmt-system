const { apiSuccess, apiError } = require('../utils/apiResponse');
const paymentService = require('../services/paymentService');
const invoiceService = require('../services/invoiceService');

const listPayments = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, invoiceId } = req.query;
    const result = await paymentService.listPayments({ page, pageSize, invoiceId });
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.createPayment(req.body, req.user.id);
    res.status(201).json(apiSuccess(payment, 'Payment recorded'));
  } catch (err) {
    if (err.message === 'INVOICE_NOT_FOUND') {
      return res.status(404).json(apiError('Invoice not found'));
    }
    next(err);
  }
};

const getNextPaymentNumber = async (req, res, next) => {
  try {
    const { paymentDate } = req.query;
    const paymentNumber = await paymentService.getNextPaymentNumber(paymentDate || null);
    res.json(apiSuccess({ paymentNumber }));
  } catch (err) {
    next(err);
  }
};

const getOpenInvoicesForCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { customerName } = req.query; // Accept customerName as query parameter
    
    console.log('[PaymentController] getOpenInvoicesForCustomer called with:', { customerId, customerName, params: req.params, query: req.query });
    
    if (!customerId && !customerName) {
      return res.status(400).json(apiError('Customer ID or Customer Name is required'));
    }
    
    const invoices = await invoiceService.getOpenInvoicesForCustomer(customerId || null, customerName || null);
    console.log('[PaymentController] Returning', invoices?.length || 0, 'invoices');
    res.json(apiSuccess(invoices));
  } catch (err) {
    console.error('[PaymentController] Error in getOpenInvoicesForCustomer:', err);
    next(err);
  }
};

module.exports = { listPayments, createPayment, getNextPaymentNumber, getOpenInvoicesForCustomer };

