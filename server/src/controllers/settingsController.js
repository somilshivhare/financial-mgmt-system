const { apiSuccess } = require('../utils/apiResponse');
const settingsService = require('../services/settingsService');

const listSettings = async (_req, res, next) => {
  try {
    const settings = await settingsService.listSettings();
    res.json(apiSuccess(settings));
  } catch (err) {
    next(err);
  }
};

const upsertSetting = async (req, res, next) => {
  try {
    const setting = await settingsService.upsertSetting(req.body, req.user.id);
    res.status(201).json(apiSuccess(setting, 'Setting saved'));
  } catch (err) {
    next(err);
  }
};

module.exports = { listSettings, upsertSetting };

