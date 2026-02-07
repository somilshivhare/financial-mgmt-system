const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { requireRole } = require('../../middleware/requireRole');
const { listUsers, getRecentLogins } = require('../../controllers/adminController');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/users', listUsers);
router.get('/login-history', getRecentLogins);

module.exports = router;
