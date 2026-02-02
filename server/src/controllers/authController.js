const { apiSuccess, apiError } = require('../utils/apiResponse');
const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { fullName, email, password, roleId } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json(apiError(
        'Missing required fields: fullName, email, and password are required',
        'ERR_MISSING_FIELDS',
        { required: ['fullName', 'email', 'password'] }
      ));
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(apiError(
        'Invalid email format',
        'ERR_INVALID_EMAIL',
        { field: 'email' }
      ));
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json(apiError(
        'Password must be at least 8 characters long',
        'ERR_WEAK_PASSWORD',
        { field: 'password', minLength: 8 }
      ));
    }
    
    // PRODUCTION FIX: Public registration must not assign admin/finance/operations.
    // Default to viewer (5); only sales (4) and viewer (5) are allowed for self-registration.
    const safeRoleId = authService.getSafeRegistrationRoleId(roleId);
    
    const result = await authService.register(fullName, email, password, safeRoleId);
    res.status(201).json(apiSuccess(result, 'User registered successfully'));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.message?.includes('Duplicate entry')) {
      return res.status(409).json(apiError(
        'An account with this email already exists',
        'ERR_DUPLICATE_EMAIL',
        { field: 'email' }
      ));
    }
    console.error('[Auth] Registration error:', err);
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    // Ensure req.body exists and is an object
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json(apiError(
        'Invalid request body',
        'ERR_INVALID_BODY',
        { message: 'Request body must be a valid JSON object' }
      ));
    }

    // Extract and validate email and password - ensure they are strings
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : null;
    const password = typeof req.body.password === 'string' ? req.body.password : null;
    
    // Validate required fields with explicit checks
    if (!email || email === '') {
      return res.status(400).json(apiError(
        'Email is required and must be a valid string',
        'ERR_MISSING_FIELDS',
        { required: ['email'], field: 'email' }
      ));
    }
    
    if (!password || password === '') {
      return res.status(400).json(apiError(
        'Password is required and must be a valid string',
        'ERR_MISSING_FIELDS',
        { required: ['password'], field: 'password' }
      ));
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(apiError(
        'Invalid email format',
        'ERR_INVALID_EMAIL',
        { field: 'email' }
      ));
    }
    
    // Get client IP with proper proxy handling - ensure non-undefined values
    const { getClientIp } = require('../middleware/rateLimit');
    const ip_address = getClientIp(req) || null;
    const user_agent = (req.headers['user-agent'] && typeof req.headers['user-agent'] === 'string') 
      ? req.headers['user-agent'] 
      : null;
    
    // Ensure loginMetadata never contains undefined values
    const loginMetadata = {
      ip_address: ip_address || null,
      user_agent: user_agent || null,
    };
    
    const result = await authService.login(email, password, loginMetadata);
    res.json(apiSuccess(result, 'Login successful'));
  } catch (err) {
    if (err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json(apiError(
        'Invalid email or password',
        'ERR_INVALID_CREDENTIALS',
        { field: 'credentials' }
      ));
    }
    console.error('[Auth] Login error:', err);
    return next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.me(req.user.id);
    res.json(apiSuccess(user));
  } catch (err) {
    return next(err);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    // Always return success; do not leak whether email exists
    res.json(apiSuccess(result, 'If the email exists, a reset link has been generated'));
  } catch (err) {
    return next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.json(apiSuccess(null, 'Password reset successful'));
  } catch (err) {
    if (err.message === 'RESET_TOKEN_INVALID') {
      return res.status(400).json(apiError('Invalid or expired reset token', 'ERR_RESET_TOKEN'));
    }
    return next(err);
  }
};

module.exports = { register, login, me, requestPasswordReset, resetPassword };