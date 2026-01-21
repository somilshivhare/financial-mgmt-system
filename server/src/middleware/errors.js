const { apiError } = require('../utils/apiResponse');

const notFound = (_req, res, _next) => {
  res.status(404).json(apiError('Not found'));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json(apiError(err.message || 'Internal server error', err.code || 'ERR_INTERNAL'));
};

module.exports = { notFound, errorHandler };