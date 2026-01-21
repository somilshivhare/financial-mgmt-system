const { apiError } = require('../utils/apiResponse');

const validate =
  (schema, property = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[property]);
    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return res.status(400).json(apiError(message, 'ERR_VALIDATION'));
    }
    req[property] = result.data;
    return next();
  };

module.exports = { validate };