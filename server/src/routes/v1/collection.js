const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { collectionPlanSchema, collectionActionSchema } = require('../../validators/collectionValidators');
const {
  listPlans,
  createPlan,
  updatePlanStatus,
  addAction,
  listActions,
  getCollectionPlanData,
  getCollectionAnalytics,
} = require('../../controllers/collectionController');

const router = express.Router();

router.get('/plans', requireAuth, listPlans);
router.get('/data', requireAuth, getCollectionPlanData);
router.get('/analytics', requireAuth, getCollectionAnalytics);
router.post('/plans', requireAuth, requireRole('admin', 'user'), validate(collectionPlanSchema), createPlan);
router.patch('/plans/:id/status', requireAuth, requireRole('admin', 'user'), updatePlanStatus);
router.get('/plans/:id/actions', requireAuth, listActions);
router.post('/plans/:id/actions', requireAuth, requireRole('admin', 'user'), validate(collectionActionSchema), addAction);

module.exports = router;

