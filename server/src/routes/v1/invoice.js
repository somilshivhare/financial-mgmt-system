const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { invoiceSchema } = require('../../validators/invoiceValidators');
const {
  listInvoices,
  createInvoice,
  updateInvoice,
  getInvoice,
  listInvoiceLines,
  getInvoicesByPONumber,
  getNextInvoiceNumber,
} = require('../../controllers/invoiceController');

const router = express.Router();

router.get('/', requireAuth, listInvoices);
router.get('/next-number', requireAuth, getNextInvoiceNumber);
router.get('/po/:poNumber', requireAuth, getInvoicesByPONumber);
router.get('/:id', requireAuth, getInvoice);
router.get('/:id/lines', requireAuth, listInvoiceLines);
router.post('/', requireAuth, requireRole('admin', 'finance'), validate(invoiceSchema), createInvoice);
router.put('/:id', requireAuth, requireRole('admin', 'finance'), updateInvoice);

module.exports = router;

