const express = require('express');
const { registerSchema, loginSchema, requestPasswordResetSchema, resetPasswordSchema } = require('../../validators/authValidators');
const { validate } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimit');
const { register, login, me, requestPasswordReset, resetPassword, logout } = require('../../controllers/authController');
const { requireAuth } = require('../../middleware/requireAuth');

const router = express.Router();

router.use(authLimiter);

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/request-password-reset', validate(requestPasswordResetSchema), requestPasswordReset);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', requireAuth, me);
router.post('/logout', logout);

module.exports = router;