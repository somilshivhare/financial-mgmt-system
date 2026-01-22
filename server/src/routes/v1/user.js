const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
// Rate limiting removed - uncomment below to re-enable
// const { profileLimiter } = require('../../middleware/rateLimit');
const {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  getSessions,
  revokeSession,
  revokeAllSessions,
  getLoginHistory,
  updatePassword,
  getPreferences,
  setPreference,
} = require('../../controllers/userController');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Rate limiting removed - uncomment below to re-enable
// router.use(profileLimiter);

// Profile management
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/photo', uploadProfilePhoto);

// Session management
router.get('/sessions', getSessions);
router.delete('/sessions/:sessionId', revokeSession);
router.delete('/sessions', revokeAllSessions);

// Login history
router.get('/login-history', getLoginHistory);

// Password management
router.put('/password', updatePassword);

// Preferences
router.get('/preferences', getPreferences);
router.put('/preferences/:key', setPreference);

module.exports = router;

