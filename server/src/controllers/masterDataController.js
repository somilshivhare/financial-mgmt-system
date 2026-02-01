const { apiSuccess, apiError } = require('../utils/apiResponse');
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

// Generic Master Data endpoints
const getMasterDataByType = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    if (!type) {
      return res.status(400).json(apiError('Type parameter is required', 'ERR_MISSING_TYPE'));
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json(apiError('Authentication required', 'ERR_UNAUTHORIZED'));
    }

    const { companyId } = req.query;
    const records = await masterDataService.getMasterDataByType(type, req.user.id, { companyId, status });
    res.json(apiSuccess(records));
  } catch (err) {
    next(err);
  }
};

const getMasterDataById = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (!req.user || !req.user.id) {
      return res.status(401).json(apiError('Authentication required', 'ERR_UNAUTHORIZED'));
    }
    const record = await masterDataService.getMasterDataById(type, id, req.user.id);
    if (!record) {
      return res.status(404).json(apiError('Record not found', 'NOT_FOUND'));
    }
    res.json(apiSuccess(record));
  } catch (err) {
    next(err);
  }
};

const saveMasterDataRecord = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { values, logoPreviews, companyId, status } = req.body;
    
    if (!values || typeof values !== 'object') {
      return res.status(400).json(apiError('Values object is required', 'ERR_INVALID_BODY'));
    }
    
    // Ensure user is authenticated and has an ID
    if (!req.user || !req.user.id) {
      return res.status(401).json(apiError('Authentication required', 'ERR_UNAUTHORIZED'));
    }
    
    const record = await masterDataService.saveMasterDataRecord(type, { values, logoPreviews, companyId, status }, req.user.id);
    res.status(201).json(apiSuccess(record, 'Master data record saved successfully'));
  } catch (err) {
    console.error('[MasterData] Save error:', err);
    next(err);
  }
};

const updateMasterDataRecord = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { values, logoPreviews, companyId, status } = req.body;
    
    if (!values || typeof values !== 'object') {
      return res.status(400).json(apiError('Values object is required', 'ERR_INVALID_BODY'));
    }
    
    const record = await masterDataService.updateMasterDataRecord(type, id, { values, logoPreviews, companyId, status }, req.user.id);
    if (!record) {
      return res.status(404).json(apiError('Record not found', 'NOT_FOUND'));
    }
    res.json(apiSuccess(record, 'Master data record updated successfully'));
  } catch (err) {
    next(err);
  }
};

const deleteMasterDataRecord = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (!req.user || !req.user.id) {
      return res.status(401).json(apiError('Authentication required', 'ERR_UNAUTHORIZED'));
    }
    const deleted = await masterDataService.deleteMasterDataRecord(type, id, req.user.id);
    if (!deleted) {
      return res.status(404).json(apiError('Record not found', 'NOT_FOUND'));
    }
    res.json(apiSuccess(null, 'Master data record deleted successfully'));
  } catch (err) {
    next(err);
  }
};

const searchMasterData = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json(apiError('Query parameter is required', 'ERR_MISSING_QUERY'));
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json(apiError('Authentication required', 'ERR_UNAUTHORIZED'));
    }
    const results = await masterDataService.searchMasterData(q, req.user.id);
    res.json(apiSuccess(results));
  } catch (err) {
    next(err);
  }
};

const getLatestMasterDataByType = async (req, res, next) => {
  try {
    const { type, companyId, status } = req.query;
    if (!type) {
      return res.status(400).json(apiError('Type parameter is required', 'ERR_MISSING_TYPE'));
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).json(apiError('Authentication required', 'ERR_UNAUTHORIZED'));
    }
    
    const record = await masterDataService.getLatestMasterDataByType(type, req.user.id, companyId || null, status || null);
    if (!record) {
      return res.json(apiSuccess(null));
    }
    res.json(apiSuccess(record));
  } catch (err) {
    next(err);
  }
};

const upsertMasterDataRecord = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { values, logoPreviews, id, companyId, status } = req.body;
    
    if (!values || typeof values !== 'object') {
      return res.status(400).json(apiError('Values object is required', 'ERR_INVALID_BODY'));
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).json(apiError('Authentication required', 'ERR_UNAUTHORIZED'));
    }
    
    const record = await masterDataService.upsertMasterDataRecord(type, { values, logoPreviews, id, companyId, status }, req.user.id);
    res.status(201).json(apiSuccess(record, 'Master data record saved successfully'));
  } catch (err) {
    console.error('[MasterData] Upsert error:', err);
    next(err);
  }
};

const getDraftMasterData = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json(apiError('Authentication required', 'ERR_UNAUTHORIZED'));
    }
    const { companyId } = req.query;
    const draftCompany = companyId
      ? await masterDataService.getMasterDataById('company-profile', companyId, req.user.id)
      : await masterDataService.getLatestDraftCompanyProfile(req.user.id);

    if (!draftCompany || draftCompany.status !== 'draft') {
      return res.json(apiSuccess(null));
    }

    const aggregated = await masterDataService.getDraftAggregatedMasterData(draftCompany.id, req.user.id);
    res.json(apiSuccess(aggregated));
  } catch (err) {
    next(err);
  }
};

const createDraftFromPublished = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json(apiError('Authentication required', 'ERR_UNAUTHORIZED'));
    }
    const { companyId } = req.body;
    if (!companyId) {
      return res.status(400).json(apiError('companyId is required', 'ERR_MISSING_COMPANY'));
    }
    const draftCompany = await masterDataService.createDraftFromPublished(companyId, req.user.id);
    res.status(201).json(apiSuccess(draftCompany));
  } catch (err) {
    next(err);
  }
};

const publishDraftMasterData = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json(apiError('Authentication required', 'ERR_UNAUTHORIZED'));
    }
    const { draftCompanyId } = req.body;
    if (!draftCompanyId) {
      return res.status(400).json(apiError('draftCompanyId is required', 'ERR_MISSING_DRAFT'));
    }
    const published = await masterDataService.publishDraftSet(draftCompanyId, req.user.id);
    res.json(apiSuccess(published, 'Draft published successfully'));
  } catch (err) {
    next(err);
  }
};

const getAggregatedMasterData = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json(apiError('Authentication required', 'ERR_UNAUTHORIZED'));
    }
    
    // Get all aggregated master data sets (multiple cards)
    const aggregatedDataList = await masterDataService.getAggregatedMasterData(req.user.id);
    res.json(apiSuccess(aggregatedDataList));
  } catch (err) {
    console.error('[MasterData] Get aggregated error:', err);
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
};

