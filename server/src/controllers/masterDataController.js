const { apiSuccess } = require('../utils/apiResponse');
const masterDataService = require('../services/masterDataService');

const listCustomers = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, q } = req.query;
    const result = await masterDataService.listCustomers({ page, pageSize, q });
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const customer = await masterDataService.createCustomer(req.body);
    res.status(201).json(apiSuccess(customer, 'Customer created'));
  } catch (err) {
    next(err);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await masterDataService.updateCustomer(req.params.id, req.body);
    res.json(apiSuccess(customer, 'Customer updated'));
  } catch (err) {
    next(err);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, q } = req.query;
    const result = await masterDataService.listProducts({ page, pageSize, q });
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await masterDataService.createProduct(req.body);
    res.status(201).json(apiSuccess(product, 'Product created'));
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await masterDataService.updateProduct(req.params.id, req.body);
    res.json(apiSuccess(product, 'Product updated'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listCustomers,
  createCustomer,
  updateCustomer,
  listProducts,
  createProduct,
  updateProduct,
};

