const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { invoiceSchema } = require('../../validators/invoiceValidators');
const {
  listInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoice,
  listInvoiceLines,
  getInvoicesByPONumber,
  getNextInvoiceNumber,
} = require('../../controllers/invoiceController');

const router = express.Router();

// Specific routes first (before parameterized routes)
router.get('/', requireAuth, listInvoices);
router.get('/next-number', requireAuth, getNextInvoiceNumber);
router.get('/po/:poNumber', requireAuth, getInvoicesByPONumber);
router.get('/:id/lines', requireAuth, listInvoiceLines);

// CRUD operations - DELETE before GET to avoid conflicts
router.delete('/:id', requireAuth, requireRole('admin', 'finance'), deleteInvoice);
router.get('/:id', requireAuth, getInvoice);
router.post('/', requireAuth, requireRole('admin', 'finance'), validate(invoiceSchema), createInvoice);
router.put('/:id', requireAuth, requireRole('admin', 'finance'), updateInvoice);

// Log registered routes in development
if (process.env.NODE_ENV !== 'production') {
  console.log('[Invoice Routes] DELETE /:id route registered');
}

module.exports = router;

