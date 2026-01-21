const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { paymentSchema } = require('../../validators/paymentValidators');
const { listPayments, createPayment } = require('../../controllers/paymentController');

const router = express.Router();

router.get('/', requireAuth, listPayments);
router.post('/', requireAuth, requireRole('admin', 'finance'), validate(paymentSchema), createPayment);

module.exports = router;

