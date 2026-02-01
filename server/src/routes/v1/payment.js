const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { paymentSchema } = require('../../validators/paymentValidators');
const { listPayments, createPayment } = require('../../controllers/paymentController');

const router = express.Router();

router.get('/', requireAuth, listPayments);
router.get('/invoice/:invoiceId', requireAuth, (req, res, next) => {
  req.query.invoiceId = req.params.invoiceId;
  return listPayments(req, res, next);
});
router.post('/', requireAuth, requireRole('admin', 'finance'), validate(paymentSchema), createPayment);

module.exports = router;

