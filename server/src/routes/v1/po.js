const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { poSchema } = require('../../validators/poValidators');
const { listPOs, createPO, updatePOStatus } = require('../../controllers/poController');

const router = express.Router();

router.get('/', requireAuth, listPOs);
router.post('/', requireAuth, requireRole('admin', 'operations', 'sales'), validate(poSchema), createPO);
router.patch('/:id/status', requireAuth, requireRole('admin', 'operations'), updatePOStatus);

module.exports = router;

