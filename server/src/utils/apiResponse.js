const apiSuccess = (data = null, message = 'ok') => ({
  success: true,
  message,
  data,
});

const apiError = (message, code = 'ERR_GENERIC') => ({
  success: false,
  code,
  message,
});

module.exports = { apiSuccess, apiError };