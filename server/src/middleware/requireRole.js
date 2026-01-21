const { apiError } = require('../utils/apiResponse');

const requireRole = (...allowed) => (req, res, next) => {
  if (!req.user?.role) {
    return res.status(403).json(apiError('Forbidden'));
  }
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json(apiError('Insufficient role'));
  }
  return next();
};

module.exports = { requireRole };