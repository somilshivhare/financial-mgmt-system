const { apiSuccess, apiError } = require('../utils/apiResponse');
const userService = require('../services/userService');
const authService = require('../services/authService');
const bcrypt = require('bcrypt');
const { env } = require('../config/env');
const { uploadProfilePhoto: uploadMiddleware } = require('../middleware/upload');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db/query');

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await authService.me(userId);
    
    if (!user) {
      return res.status(404).json(apiError('User not found', 'ERR_NOT_FOUND'));
    }

    let profile = null;
    try {
      profile = await userService.getUserProfile(userId);
    } catch (err) {
      console.warn('Failed to get user profile:', err.message);
    }
    
    let sessions = [];
    try {
      sessions = await userService.getActiveUserSessions(userId);
    } catch (err) {
      console.warn('Failed to get sessions:', err.message);
    }
    
    let loginHistory = [];
    try {
      loginHistory = await userService.getUserLoginHistory(userId, 10);
    } catch (err) {
      console.warn('Failed to get login history:', err.message);
    }
    
    let preferences = [];
    try {
      preferences = await userService.getUserPreferences(userId);
    } catch (err) {
      console.warn('Failed to get preferences:', err.message);
    }
    
    const prefsMap = {};
    preferences.forEach((p) => {
      prefsMap[p.preference_key] = p.preference_value;
    });

    res.json(apiSuccess({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: user.last_login_at,
        lastLoginIp: user.last_login_ip,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
      },
      profile: profile || {},
      sessions: sessions.map((s, index) => {
        const isCurrent = index === 0;
        
        return {
          id: s.id,
          device: `${s.browser || 'Unknown'} on ${s.os || 'Unknown'}`,
          deviceType: s.device_type || 'desktop',
          location: s.location || 'Unknown',
          lastActive: s.last_activity_at,
          current: isCurrent,
          ipAddress: s.ip_address || '',
        };
      }),
      loginHistory: loginHistory.map((h) => ({
        id: h.id,
        loginAt: h.login_at,
        ipAddress: h.ip_address || '',
        device: `${h.browser || 'Unknown'} on ${h.os || 'Unknown'}`,
        location: h.location || 'Unknown',
        status: h.status,
        failureReason: h.failure_reason,
      })),
      preferences: prefsMap,
    }));
  } catch (err) {
    console.error('Error in getProfile:', err);
    return next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name, // full_name in users table
      phone,
      mobile,
      company_name, // Read-only, only admins can change
      department,
      designation,
      address,
      city,
      state,
      country,
      pin_code,
      bio,
      timezone,
      language,
      date_format,
    } = req.body;

    // Allow profile owner to save their own company_name; admin can change any user's via admin APIs
    const finalCompanyName = company_name !== undefined ? company_name : undefined;

    if (name && name.trim()) {
      await query(
        'UPDATE users SET full_name = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [name.trim(), userId, userId]
      );
    }

    await userService.upsertUserProfile(userId, {
      phone,
      mobile,
      company_name: finalCompanyName,
      department,
      designation,
      address,
      city,
      state,
      country,
      pin_code,
      bio,
      timezone,
      language,
      date_format,
    }, userId); // Pass userId for audit tracking

    if (timezone) {
      await userService.setUserPreference(userId, 'timezone', timezone);
    }
    if (language) {
      await userService.setUserPreference(userId, 'language', language);
    }
    if (date_format) {
      await userService.setUserPreference(userId, 'date_format', date_format);
    }

    await userService.logUserActivity(userId, {
      action_type: 'profile_updated',
      action_description: 'Updated user profile',
      resource_type: 'user_profile',
      resource_id: userId,
      ip_address: req.ip || 'unknown',
      user_agent: req.headers['user-agent'] || '',
    });

    res.json(apiSuccess(null, 'Profile updated successfully'));
  } catch (err) {
    return next(err);
  }
};

const uploadProfilePhoto = async (req, res, next) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json(apiError('File size exceeds 2MB limit', 'ERR_FILE_TOO_LARGE'));
        }
        return res.status(400).json(apiError(err.message, 'ERR_UPLOAD_ERROR'));
      }
      return res.status(400).json(apiError(err.message, 'ERR_INVALID_FILE'));
    }

    if (!req.file) {
      return res.status(400).json(apiError('No file uploaded', 'ERR_NO_FILE'));
    }

    try {
      const userId = req.user.id;
      const fileUrl = `/uploads/profiles/${req.file.filename}`;

      const existingProfile = await userService.getUserProfile(userId);
      let oldPhotoPath = null;
      if (existingProfile && existingProfile.profile_picture_url) {
        const oldFilename = existingProfile.profile_picture_url.split('/').pop();
        oldPhotoPath = path.join(__dirname, '../../uploads/profiles', oldFilename);
      }

      await userService.upsertUserProfile(userId, {
        profile_picture_url: fileUrl,
      }, userId);

      if (oldPhotoPath && fs.existsSync(oldPhotoPath)) {
        try {
          fs.unlinkSync(oldPhotoPath);
        } catch (unlinkErr) {
          console.warn('Failed to delete old profile photo:', unlinkErr);
        }
      }

      await userService.logUserActivity(userId, {
        action_type: 'profile_photo_updated',
        action_description: 'Updated profile photo',
        resource_type: 'user_profile',
        resource_id: userId,
        ip_address: req.ip || 'unknown',
        user_agent: req.headers['user-agent'] || '',
      });

      res.json(apiSuccess({ photoUrl: fileUrl }, 'Profile photo uploaded successfully'));
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error('Failed to clean up uploaded file:', unlinkErr);
        }
      }
      return next(err);
    }
  });
};

const getSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sessions = await userService.getActiveUserSessions(userId);
    
    res.json(apiSuccess(sessions.map((s) => ({
      id: s.id,
      device: `${s.browser} on ${s.os}`,
      deviceType: s.device_type,
      location: s.location || 'Unknown',
      lastActive: s.last_activity_at,
      createdAt: s.created_at,
      ipAddress: s.ip_address,
    }))));
  } catch (err) {
    return next(err);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const sessions = await userService.getActiveUserSessions(userId);
    const session = sessions.find((s) => s.id === sessionId);
    
    if (!session) {
      return res.status(404).json(apiError('Session not found', 'ERR_NOT_FOUND'));
    }

    await userService.deactivateSession(sessionId);
    
    res.json(apiSuccess(null, 'Session revoked'));
  } catch (err) {
    return next(err);
  }
};

const revokeAllSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await userService.deactivateAllUserSessions(userId);
    
    res.json(apiSuccess(null, 'All sessions revoked'));
  } catch (err) {
    return next(err);
  }
};

const getLoginHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const history = await userService.getUserLoginHistory(userId, limit);
    
    res.json(apiSuccess(history.map((h) => ({
      id: h.id,
      loginAt: h.login_at,
      ipAddress: h.ip_address,
      device: `${h.browser} on ${h.os}`,
      location: h.location || 'Unknown',
      status: h.status,
      failureReason: h.failure_reason,
    }))));
  } catch (err) {
    return next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(apiError('Current password and new password are required', 'ERR_MISSING_FIELDS'));
    }

    if (newPassword.length < 8) {
      return res.status(400).json(apiError('New password must be at least 8 characters', 'ERR_INVALID_PASSWORD'));
    }

    const { query } = require('../db/query');
    const users = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    const user = users[0];

    if (!user) {
      return res.status(404).json(apiError('User not found', 'ERR_NOT_FOUND'));
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json(apiError('Current password is incorrect', 'ERR_INVALID_PASSWORD'));
    }

    const newPasswordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newPasswordHash, userId]);

    await userService.updateUserSecuritySettings(userId, {
      password_changed_at: new Date(),
      last_password_change_at: new Date(),
      failed_login_attempts: 0,
    });

    await userService.logUserActivity(userId, {
      action_type: 'password_changed',
      action_description: 'User changed password',
      resource_type: 'user',
      resource_id: userId,
      ip_address: req.ip || 'unknown',
      user_agent: req.headers['user-agent'] || '',
    });

    res.json(apiSuccess(null, 'Password updated successfully'));
  } catch (err) {
    return next(err);
  }
};

const getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const preferences = await userService.getUserPreferences(userId);
    const prefsMap = {};
    preferences.forEach((p) => {
      prefsMap[p.preference_key] = p.preference_value;
    });
    
    res.json(apiSuccess(prefsMap));
  } catch (err) {
    return next(err);
  }
};

const setPreference = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { key } = req.params;
    const { value } = req.body;

    await userService.setUserPreference(userId, key, value);
    
    res.json(apiSuccess(null, 'Preference updated'));
  } catch (err) {
    return next(err);
  }
};

module.exports = {
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
};

