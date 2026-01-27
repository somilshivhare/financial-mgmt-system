const { apiSuccess, apiError } = require('../utils/apiResponse');
const poService = require('../services/poService');

const listPOs = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status, q } = req.query;
    const result = await poService.listPOs({ page, pageSize, status, q });
    res.json(apiSuccess(result));
  } catch (err) {
    next(err);
  }
};

const createPO = async (req, res, next) => {
  try {
    const po = await poService.createPO(req.body, req.user.id);
    res.status(201).json(apiSuccess(po, 'PO created'));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(apiError('PO number already exists', 'ERR_DUPLICATE'));
    }
    next(err);
  }
};

const updatePOStatus = async (req, res, next) => {
  try {
    const po = await poService.updateStatus(req.params.id, req.body.status, req.user.id);
    res.json(apiSuccess(po, 'PO status updated'));
  } catch (err) {
    next(err);
  }
};

const getPO = async (req, res, next) => {
  try {
    const po = await poService.getPO(req.params.id);
    if (!po) {
      return res.status(404).json(apiError('PO not found', 'NOT_FOUND'));
    }
    res.json(apiSuccess(po));
  } catch (err) {
    next(err);
  }
};

const getPODraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const draft = await poService.getPODraft(id || null, req.user.id);
    if (!draft) {
      return res.json(apiSuccess(null));
    }
    res.json(apiSuccess(draft));
  } catch (err) {
    next(err);
  }
};

const upsertPODraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await poService.upsertPODraft(req.body, req.user.id, id || null);
    res.status(201).json(apiSuccess(po, 'PO draft saved'));
  } catch (err) {
    console.error('[PO Controller] Upsert error:', err);
    next(err);
  }
};

module.exports = { listPOs, createPO, updatePOStatus, getPO, getPODraft, upsertPODraft };

