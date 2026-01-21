const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { customerSchema, productSchema } = require('../../validators/masterDataValidators');
const {
  listCustomers,
  createCustomer,
  updateCustomer,
  listProducts,
  createProduct,
  updateProduct,
} = require('../../controllers/masterDataController');

const router = express.Router();

router.get('/customers', requireAuth, listCustomers);
router.post('/customers', requireAuth, requireRole('admin', 'sales', 'operations'), validate(customerSchema), createCustomer);
router.put('/customers/:id', requireAuth, requireRole('admin', 'sales', 'operations'), validate(customerSchema), updateCustomer);

router.get('/products', requireAuth, listProducts);
router.post('/products', requireAuth, requireRole('admin', 'operations'), validate(productSchema), createProduct);
router.put('/products/:id', requireAuth, requireRole('admin', 'operations'), validate(productSchema), updateProduct);

module.exports = router;

