const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { customerSchema, productSchema } = require('../../validators/masterDataValidators');
const masterDataController = require('../../controllers/masterDataController');
const {
  listCustomers,
  createCustomer,
  updateCustomer,
  listProducts,
  createProduct,
  updateProduct,
  getMasterDataByType,
  getMasterDataById,
  getLatestMasterDataByType,
  saveMasterDataRecord,
  updateMasterDataRecord,
  upsertMasterDataRecord,
  deleteMasterDataRecord,
  searchMasterData,
  getAggregatedMasterData,
  getDraftMasterData,
  createDraftFromPublished,
  publishDraftMasterData,
} = masterDataController;

const router = express.Router();

router.get('/customers', requireAuth, listCustomers);
router.post('/customers', requireAuth, requireRole('admin', 'sales', 'operations'), validate(customerSchema), createCustomer);
router.put('/customers/:id', requireAuth, requireRole('admin', 'sales', 'operations'), validate(customerSchema), updateCustomer);

router.get('/products', requireAuth, listProducts);
router.post('/products', requireAuth, requireRole('admin', 'operations'), validate(productSchema), createProduct);
router.put('/products/:id', requireAuth, requireRole('admin', 'operations'), validate(productSchema), updateProduct);

// Generic Master Data endpoints
// IMPORTANT: More specific routes must come before parameterized routes
router.get('/aggregated', requireAuth, getAggregatedMasterData);
router.get('/draft', requireAuth, getDraftMasterData);
router.post('/draft/from-published', requireAuth, requireRole('admin', 'operations', 'sales'), createDraftFromPublished);
router.post('/draft/publish', requireAuth, requireRole('admin', 'operations', 'sales'), publishDraftMasterData);
router.get('/latest', requireAuth, getLatestMasterDataByType);
router.get('/search', requireAuth, searchMasterData);
router.get('/', requireAuth, getMasterDataByType);
router.post('/:type/upsert', requireAuth, requireRole('admin', 'operations', 'sales'), upsertMasterDataRecord);
router.get('/:type/:id', requireAuth, getMasterDataById);
router.post('/:type', requireAuth, requireRole('admin', 'operations', 'sales'), saveMasterDataRecord);
router.put('/:type/:id', requireAuth, requireRole('admin', 'operations', 'sales'), updateMasterDataRecord);
router.delete('/:type/:id', requireAuth, requireRole('admin', 'operations'), deleteMasterDataRecord);

module.exports = router;

