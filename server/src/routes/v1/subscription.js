const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { subscriptionSchema } = require('../../validators/subscriptionValidators');
const { getSubscription, upsertSubscription } = require('../../controllers/subscriptionController');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), getSubscription);
router.post('/', requireAuth, requireRole('admin'), validate(subscriptionSchema), upsertSubscription);

module.exports = router;

