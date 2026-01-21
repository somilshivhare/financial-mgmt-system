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

module.exports = { listPOs, createPO, updatePOStatus };

