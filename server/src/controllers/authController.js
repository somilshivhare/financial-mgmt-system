const { apiSuccess, apiError } = require('../utils/apiResponse');
const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { fullName, email, password, roleId } = req.body;
    const result = await authService.register(fullName, email, password, roleId);
    res.status(201).json(apiSuccess(result, 'User registered'));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(apiError('Email already exists', 'ERR_DUPLICATE'));
    }
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(apiSuccess(result, 'Logged in'));
  } catch (err) {
    if (err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json(apiError('Invalid credentials', 'ERR_INVALID_CREDENTIALS'));
    }
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