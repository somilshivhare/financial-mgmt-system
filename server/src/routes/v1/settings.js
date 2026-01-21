const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { validate } = require('../../middleware/validate');
const { settingSchema } = require('../../validators/settingsValidators');
const { listSettings, upsertSetting } = require('../../controllers/settingsController');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), listSettings);
router.post('/', requireAuth, requireRole('admin'), validate(settingSchema), upsertSetting);

module.exports = router;

