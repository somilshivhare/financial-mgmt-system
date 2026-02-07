const express = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
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

router.use(requireAuth);


router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/photo', uploadProfilePhoto);

router.get('/sessions', getSessions);
router.delete('/sessions/:sessionId', revokeSession);
router.delete('/sessions', revokeAllSessions);

router.get('/login-history', getLoginHistory);

router.put('/password', updatePassword);

router.get('/preferences', getPreferences);
router.put('/preferences/:key', setPreference);

module.exports = router;

