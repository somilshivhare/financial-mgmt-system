const apiSuccess = (data = null, message = 'ok') => ({
  success: true,
  message,
  data,
});

const apiError = (message, code = 'ERR_GENERIC', data = null) => ({
  success: false,
  code,
  message,
  ...(data && { data }),
});

module.exports = { apiSuccess, apiError };