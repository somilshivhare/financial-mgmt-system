const { apiSuccess, apiError } = require('../utils/apiResponse');
const paymentService = require('../services/paymentService');

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

module.exports = { listPayments, createPayment };

