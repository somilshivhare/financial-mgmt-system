const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { invoiceSchema } = require('../../validators/invoiceValidators');
const {
  listInvoices,
  createInvoice,
  getInvoice,
  listInvoiceLines,
} = require('../../controllers/invoiceController');

const router = express.Router();

router.get('/', requireAuth, listInvoices);
router.get('/:id', requireAuth, getInvoice);
router.get('/:id/lines', requireAuth, listInvoiceLines);
router.post('/', requireAuth, requireRole('admin', 'finance'), validate(invoiceSchema), createInvoice);

module.exports = router;

