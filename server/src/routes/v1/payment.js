const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { paymentSchema } = require('../../validators/paymentValidators');
const { listPayments, createPayment, getNextPaymentNumber, getOpenInvoicesForCustomer } = require('../../controllers/paymentController');

const router = express.Router();

router.get('/', requireAuth, listPayments);
router.get('/next-number', requireAuth, getNextPaymentNumber);

// IMPORTANT: /open-invoices route must come before /invoice route to avoid route conflicts
// This route handles: GET /api/v1/payments/open-invoices/:customerId?customerName=...
router.get('/open-invoices/:customerId', requireAuth, (req, res, next) => {
  console.log('[PaymentRoutes] /open-invoices route hit:', {
    customerId: req.params.customerId,
    customerName: req.query.customerName,
    fullUrl: req.originalUrl,
    method: req.method
  });
  return getOpenInvoicesForCustomer(req, res, next);
});

router.get('/invoice/:invoiceId', requireAuth, (req, res, next) => {
  req.query.invoiceId = req.params.invoiceId;
  return listPayments(req, res, next);
});
router.post('/', requireAuth, requireRole('admin', 'finance'), validate(paymentSchema), createPayment);

module.exports = router;

