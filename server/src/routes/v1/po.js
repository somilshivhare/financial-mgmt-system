const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { poSchema } = require('../../validators/poValidators');
const { listPOs, createPO, updatePOStatus, getPO, getPODraft, upsertPODraft, deletePO, getPONumbers, getPOByNumber } = require('../../controllers/poController');

const router = express.Router();

router.get('/', requireAuth, listPOs);
router.get('/draft', requireAuth, getPODraft);
router.get('/numbers', requireAuth, getPONumbers);
router.get('/po/:poNumber', requireAuth, getPOByNumber);
router.get('/:id', requireAuth, getPO);
router.get('/:id/draft', requireAuth, getPODraft);
router.post('/', requireAuth, requireRole('admin', 'operations', 'sales'), validate(poSchema), createPO);
router.post('/draft', requireAuth, requireRole('admin', 'operations', 'sales'), upsertPODraft);
router.post('/:id/draft', requireAuth, requireRole('admin', 'operations', 'sales'), upsertPODraft);
router.patch('/:id/status', requireAuth, requireRole('admin', 'operations'), updatePOStatus);
router.delete('/:id', requireAuth, requireRole('admin', 'operations'), deletePO);

module.exports = router;

