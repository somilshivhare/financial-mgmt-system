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

// Generic Master Data endpoints
const getMasterDataByType = async (req, res, next) => {
  try {
    const { type, status } = req.query;
    if (!type) {
      return res.status(400).json({ success: false, code: 'ERR_MISSING_TYPE', message: 'Type parameter is required' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Authentication required' });
    }

    const { companyId } = req.query;
    const records = await masterDataService.getMasterDataByType(type, req.user.id, { companyId, status });
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};

const getMasterDataById = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Authentication required' });
    }
    const record = await masterDataService.getMasterDataById(type, id, req.user.id);
    if (!record) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Record not found' });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

const saveMasterDataRecord = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { values, logoPreviews, companyId, status } = req.body;
    
    if (!values || typeof values !== 'object') {
      return res.status(400).json({ success: false, code: 'ERR_INVALID_BODY', message: 'Values object is required' });
    }
    
    // Ensure user is authenticated and has an ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Authentication required' });
    }
    
    const record = await masterDataService.saveMasterDataRecord(type, { values, logoPreviews, companyId, status }, req.user.id);
    res.status(201).json({ success: true, data: record, message: 'Master data record saved successfully' });
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
      return res.status(400).json({ success: false, code: 'ERR_INVALID_BODY', message: 'Values object is required' });
    }
    
    const record = await masterDataService.updateMasterDataRecord(type, id, { values, logoPreviews, companyId, status }, req.user.id);
    if (!record) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Record not found' });
    }
    res.json({ success: true, data: record, message: 'Master data record updated successfully' });
  } catch (err) {
    next(err);
  }
};

const deleteMasterDataRecord = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Authentication required' });
    }
    const deleted = await masterDataService.deleteMasterDataRecord(type, id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Record not found' });
    }
    res.json({ success: true, message: 'Master data record deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const searchMasterData = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, code: 'ERR_MISSING_QUERY', message: 'Query parameter is required' });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Authentication required' });
    }
    const results = await masterDataService.searchMasterData(q, req.user.id);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

const getLatestMasterDataByType = async (req, res, next) => {
  try {
    const { type, companyId, status } = req.query;
    if (!type) {
      return res.status(400).json({ success: false, code: 'ERR_MISSING_TYPE', message: 'Type parameter is required' });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Authentication required' });
    }
    
    const record = await masterDataService.getLatestMasterDataByType(type, req.user.id, companyId || null, status || null);
    if (!record) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

const upsertMasterDataRecord = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { values, logoPreviews, id, companyId, status } = req.body;
    
    if (!values || typeof values !== 'object') {
      return res.status(400).json({ success: false, code: 'ERR_INVALID_BODY', message: 'Values object is required' });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Authentication required' });
    }
    
    const record = await masterDataService.upsertMasterDataRecord(type, { values, logoPreviews, id, companyId, status }, req.user.id);
    res.status(201).json({ success: true, data: record, message: 'Master data record saved successfully' });
  } catch (err) {
    console.error('[MasterData] Upsert error:', err);
    next(err);
  }
};

const getDraftMasterData = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Authentication required' });
    }
    const { companyId } = req.query;
    const draftCompany = companyId
      ? await masterDataService.getMasterDataById('company-profile', companyId, req.user.id)
      : await masterDataService.getLatestDraftCompanyProfile(req.user.id);

    if (!draftCompany || draftCompany.status !== 'draft') {
      return res.json({ success: true, data: null });
    }

    const aggregated = await masterDataService.getDraftAggregatedMasterData(draftCompany.id, req.user.id);
    res.json({ success: true, data: aggregated });
  } catch (err) {
    next(err);
  }
};

const createDraftFromPublished = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Authentication required' });
    }
    const { companyId } = req.body;
    if (!companyId) {
      return res.status(400).json({ success: false, code: 'ERR_MISSING_COMPANY', message: 'companyId is required' });
    }
    const draftCompany = await masterDataService.createDraftFromPublished(companyId, req.user.id);
    res.status(201).json({ success: true, data: draftCompany });
  } catch (err) {
    next(err);
  }
};

const publishDraftMasterData = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Authentication required' });
    }
    const { draftCompanyId } = req.body;
    if (!draftCompanyId) {
      return res.status(400).json({ success: false, code: 'ERR_MISSING_DRAFT', message: 'draftCompanyId is required' });
    }
    const published = await masterDataService.publishDraftSet(draftCompanyId, req.user.id);
    res.json({ success: true, data: published, message: 'Draft published successfully' });
  } catch (err) {
    next(err);
  }
};

const getAggregatedMasterData = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Authentication required' });
    }
    
    // Get all aggregated master data sets (multiple cards)
    const aggregatedDataList = await masterDataService.getAggregatedMasterData(req.user.id);
    res.json({ success: true, data: aggregatedDataList });
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

