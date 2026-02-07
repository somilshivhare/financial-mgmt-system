const { apiSuccess, apiError } = require('../utils/apiResponse');
const userService = require('../services/userService');

const listUsers = async (req, res, next) => {
  try {
    const [users, storageRows] = await Promise.all([
      userService.listAllUsersForAdmin(),
      userService.getStorageByUserForAdmin(),
    ]);
    const storageByUser = (storageRows || []).reduce((acc, row) => {
      acc[row.user_id] = Number(row.storage_bytes) || 0;
      return acc;
    }, {});
    const usersWithStorage = users.map((u) => ({
      ...u,
      storage_bytes: storageByUser[u.id] ?? 0,
    }));
    res.json(apiSuccess(usersWithStorage, 'Users retrieved'));
  } catch (err) {
    console.error('[Admin] listUsers error:', err);
    next(err);
  }
};

const getRecentLogins = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const logins = await userService.getRecentLoginsForAdmin(limit);
    res.json(apiSuccess(logins, 'Recent logins retrieved'));
  } catch (err) {
    console.error('[Admin] getRecentLogins error:', err);
    next(err);
  }
};

module.exports = { listUsers, getRecentLogins };
