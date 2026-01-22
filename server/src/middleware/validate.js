const { apiError } = require('../utils/apiResponse');

const validate =
  (schema, property = 'body') =>
  (req, res, next) => {
    // Ensure the property exists and is an object
    if (!req[property] || typeof req[property] !== 'object') {
      return res.status(400).json(apiError(
        `Invalid ${property}: must be a valid object`,
        'ERR_INVALID_BODY',
        { property }
      ));
    }

    const result = schema.safeParse(req[property]);
    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return res.status(400).json(apiError(message, 'ERR_VALIDATION', {
        issues: result.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      }));
    }
    
    // Replace req[property] with validated and sanitized data
    req[property] = result.data;
    return next();
  };

module.exports = { validate };