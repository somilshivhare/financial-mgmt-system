const { apiSuccess } = require('../utils/apiResponse');
const collectionService = require('../services/collectionService');

const listPlans = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status, invoiceId } = req.query;
    const result = await collectionService.listPlans({ page, pageSize, status, invoiceId });
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const plan = await collectionService.createPlan(req.body, req.user.id);
    res.status(201).json(apiSuccess(plan, 'Collection plan created'));
  } catch (err) {
    next(err);
  }
};

const updatePlanStatus = async (req, res, next) => {
  try {
    const plan = await collectionService.updatePlanStatus(req.params.id, req.body.status);
    res.json(apiSuccess(plan, 'Status updated'));
  } catch (err) {
    next(err);
  }
};

const listActions = async (req, res, next) => {
  try {
    const actions = await collectionService.listActions(req.params.id);
    res.json(apiSuccess(actions));
  } catch (err) {
    next(err);
  }
};

const addAction = async (req, res, next) => {
  try {
    const action = await collectionService.addAction(req.params.id, req.body, req.user.id);
    res.status(201).json(apiSuccess(action, 'Action added'));
  } catch (err) {
    next(err);
  }
};

const getCollectionPlanData = async (req, res, next) => {
  try {
    const filters = {
      personId: req.query.personId || null,
      businessUnit: req.query.businessUnit || null,
      month: req.query.month || null,
    };
    const data = await collectionService.getCollectionPlanData(filters);
    res.json(apiSuccess(data));
  } catch (err) {
    next(err);
  }
};

const getCollectionAnalytics = async (req, res, next) => {
  try {
    const filters = {
      personId: req.query.personId || null,
      businessUnit: req.query.businessUnit || null,
      month: req.query.month || null,
    };
    const analytics = await collectionService.getCollectionAnalytics(filters);
    res.json(apiSuccess(analytics));
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  listPlans, 
  createPlan, 
  updatePlanStatus, 
  listActions, 
  addAction,
  getCollectionPlanData,
  getCollectionAnalytics,
};

