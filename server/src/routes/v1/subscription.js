const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { validate } = require('../../middleware/validate');
const { subscriptionSchema } = require('../../validators/subscriptionValidators');
const {
  getSubscription,
  upsertSubscription,
  getMySubscription,
  getPlans,
  getBilling,
  upgrade,
  cancel,
  getUsage,
  downloadInvoice,
} = require('../../controllers/subscriptionController');

const router = express.Router();

// Subscription page endpoints (authenticated users)
router.get('/', requireAuth, getMySubscription);
router.put('/', requireAuth, validate(subscriptionSchema), upsertSubscription); // legacy-ish: allow UI to save subscription payloads
router.post('/', requireAuth, validate(subscriptionSchema), upsertSubscription); // backward compatibility

router.get('/plans', requireAuth, getPlans);
router.get('/billing', requireAuth, getBilling);
router.get('/usage', requireAuth, getUsage);
router.post('/upgrade/:planId', requireAuth, upgrade);
router.post('/cancel', requireAuth, cancel);
router.get('/invoices/:invoiceId/download', requireAuth, downloadInvoice);

module.exports = router;

