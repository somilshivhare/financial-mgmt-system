const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/query');

/**
 * Get user profile by user ID
 */
const getUserProfile = async (userId) => {
  try {
    // Get user profile if it exists, otherwise return null
    const profiles = await query(
      `SELECT up.*
       FROM user_profiles up
       WHERE up.user_id = ?`,
      [userId]
    );
    return profiles[0] || null;
  } catch (err) {
    // If table doesn't exist yet, return null (graceful degradation)
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes('user_profiles')) {
      console.warn('user_profiles table does not exist yet');
      return null;
    }
    throw err;
  }
};

/**
 * Create or update user profile
 * @param {string} userId - User ID
 * @param {object} profileData - Profile data to update
 * @param {string} updatedBy - User ID who is making the update (for audit)
 */
const upsertUserProfile = async (userId, profileData, updatedBy = null) => {
  const {
    phone,
    mobile,
    company_name,
    department,
    designation,
    address,
    city,
    state,
    country,
    pin_code,
    profile_picture_url,
    bio,
    timezone,
    language,
    date_format,
  } = profileData;

  // Use userId as updatedBy if not provided
  const auditUserId = updatedBy || userId;

  try {
    // Check if profile exists
    const existing = await query('SELECT id FROM user_profiles WHERE user_id = ?', [userId]);
    
    if (existing.length > 0) {
      // Update existing profile - only update fields that are provided (not undefined)
      // This allows partial updates
      const updates = [];
      const values = [];
      
      if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
      if (mobile !== undefined) { updates.push('mobile = ?'); values.push(mobile); }
      if (company_name !== undefined) { updates.push('company_name = ?'); values.push(company_name); }
      if (department !== undefined) { updates.push('department = ?'); values.push(department); }
      if (designation !== undefined) { updates.push('designation = ?'); values.push(designation); }
      if (address !== undefined) { updates.push('address = ?'); values.push(address); }
      if (city !== undefined) { updates.push('city = ?'); values.push(city); }
      if (state !== undefined) { updates.push('state = ?'); values.push(state); }
      if (country !== undefined) { updates.push('country = ?'); values.push(country); }
      if (pin_code !== undefined) { updates.push('pin_code = ?'); values.push(pin_code); }
      if (profile_picture_url !== undefined) { updates.push('profile_picture_url = ?'); values.push(profile_picture_url || null); }
      if (bio !== undefined) { updates.push('bio = ?'); values.push(bio); }
      if (timezone !== undefined) { updates.push('timezone = ?'); values.push(timezone); }
      if (language !== undefined) { updates.push('language = ?'); values.push(language); }
      if (date_format !== undefined) { updates.push('date_format = ?'); values.push(date_format); }
      
      // Always update audit fields
      updates.push('updated_at = NOW()');
      
      if (updates.length > 1) { // More than just updated_at
        values.push(userId);
        await query(
          `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
          values
        );
      }
      
      return { id: existing[0].id, user_id: userId };
    } else {
      // Create new profile
      const id = uuidv4();
      await query(
        `INSERT INTO user_profiles (
          id, user_id, phone, mobile, company_name, department, designation,
          address, city, state, country, pin_code, profile_picture_url, bio,
          timezone, language, date_format
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, userId, phone || null, mobile || null, company_name || null, department || null, designation || null,
          address || null, city || null, state || null, country || null, pin_code || null, profile_picture_url || null, bio || null,
          timezone || null, language || null, date_format || null,
        ]
      );
      return { id, user_id: userId };
    }
  } catch (err) {
    // If table doesn't exist, throw helpful error
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes('user_profiles')) {
      throw new Error('User profiles table does not exist. Please run migrations: npm run migrate');
    }
    throw err;
  }
};

/**
 * Log user login attempt
 */
const logLoginAttempt = async (userId, loginData) => {
  const {
    ip_address,
    user_agent,
    device_type,
    browser,
    os,
    location,
    status = 'success',
    failure_reason,
    token_id,
  } = loginData;

  // Convert undefined to null for SQL (MySQL2 doesn't accept undefined)
  const id = uuidv4();
  await query(
    `INSERT INTO user_login_history (
      id, user_id, login_at, ip_address, user_agent, device_type,
      browser, os, location, status, failure_reason, token_id
    ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, 
      userId, 
      ip_address || null, 
      user_agent || null, 
      device_type || null, 
      browser || null, 
      os || null, 
      location || null, 
      status || 'success', 
      failure_reason || null, 
      token_id || null
    ]
  );
  return { id };
};

/**
 * Get user login history
 */
const getUserLoginHistory = async (userId, limit = 50) => {
  try {
    return await query(
      `SELECT * FROM user_login_history
       WHERE user_id = ?
       ORDER BY login_at DESC
       LIMIT ?`,
      [userId, limit]
    );
  } catch (err) {
    // If table doesn't exist yet, return empty array
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes('user_login_history')) {
      return [];
    }
    throw err;
  }
};

/**
 * Create or update user session
 */
const createUserSession = async (userId, sessionData) => {
  const {
    token_hash,
    refresh_token_hash,
    ip_address,
    user_agent,
    device_type,
    browser,
    os,
    location,
    expires_at,
  } = sessionData;

  // Convert undefined to null for SQL (MySQL2 doesn't accept undefined)
  const id = uuidv4();
  await query(
    `INSERT INTO user_sessions (
      id, user_id, token_hash, refresh_token_hash, ip_address, user_agent,
      device_type, browser, os, location, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, 
      userId, 
      token_hash || null, 
      refresh_token_hash || null, 
      ip_address || null, 
      user_agent || null, 
      device_type || null, 
      browser || null, 
      os || null, 
      location || null, 
      expires_at || null
    ]
  );
  return { id };
};

/**
 * Get active user sessions
 */
const getActiveUserSessions = async (userId) => {
  try {
    return await query(
      `SELECT * FROM user_sessions
       WHERE user_id = ? AND is_active = TRUE AND expires_at > NOW()
       ORDER BY last_activity_at DESC`,
      [userId]
    );
  } catch (err) {
    // If table doesn't exist yet, return empty array
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes('user_sessions')) {
      return [];
    }
    throw err;
  }
};

/**
 * Deactivate user session
 */
const deactivateSession = async (sessionId) => {
  await query(
    'UPDATE user_sessions SET is_active = FALSE WHERE id = ?',
    [sessionId]
  );
};

/**
 * Deactivate all user sessions
 */
const deactivateAllUserSessions = async (userId) => {
  await query(
    'UPDATE user_sessions SET is_active = FALSE WHERE user_id = ?',
    [userId]
  );
};

/**
 * Get user preference
 */
const getUserPreference = async (userId, preferenceKey) => {
  const prefs = await query(
    'SELECT * FROM user_preferences WHERE user_id = ? AND preference_key = ?',
    [userId, preferenceKey]
  );
  return prefs[0] || null;
};

/**
 * Set user preference
 */
const setUserPreference = async (userId, preferenceKey, preferenceValue) => {
  const existing = await query(
    'SELECT id FROM user_preferences WHERE user_id = ? AND preference_key = ?',
    [userId, preferenceKey]
  );

  if (existing.length > 0) {
    await query(
      'UPDATE user_preferences SET preference_value = ?, updated_at = NOW() WHERE id = ?',
      [preferenceValue, existing[0].id]
    );
    return { id: existing[0].id };
  } else {
    const id = uuidv4();
    await query(
      'INSERT INTO user_preferences (id, user_id, preference_key, preference_value) VALUES (?, ?, ?, ?)',
      [id, userId, preferenceKey, preferenceValue]
    );
    return { id };
  }
};

/**
 * Get all user preferences
 */
const getUserPreferences = async (userId) => {
  try {
    return await query(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );
  } catch (err) {
    // If table doesn't exist yet, return empty array
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes('user_preferences')) {
      return [];
    }
    throw err;
  }
};

/**
 * Log user activity
 */
const logUserActivity = async (userId, activityData) => {
  const {
    action_type,
    action_description,
    resource_type,
    resource_id,
    ip_address,
    user_agent,
    metadata,
  } = activityData;

  const id = uuidv4();
  await query(
    `INSERT INTO user_activity_log (
      id, user_id, action_type, action_description, resource_type,
      resource_id, ip_address, user_agent, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, action_type, action_description, resource_type, resource_id, ip_address, user_agent, JSON.stringify(metadata || {})]
  );
  return { id };
};

/**
 * Get user activity log
 */
const getUserActivityLog = async (userId, limit = 100) => {
  return await query(
    `SELECT * FROM user_activity_log
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [userId, limit]
  );
};

/**
 * Get or create user security settings
 */
const getUserSecuritySettings = async (userId) => {
  const settings = await query(
    'SELECT * FROM user_security_settings WHERE user_id = ?',
    [userId]
  );

  if (settings.length > 0) {
    return settings[0];
  }

  // Create default security settings
  const id = uuidv4();
  await query(
    `INSERT INTO user_security_settings (id, user_id) VALUES (?, ?)`,
    [id, userId]
  );
  return await getUserSecuritySettings(userId);
};

/**
 * Update user security settings
 */
const updateUserSecuritySettings = async (userId, settingsData) => {
  const {
    two_factor_enabled,
    two_factor_secret,
    password_changed_at,
    password_expires_at,
    failed_login_attempts,
    account_locked_until,
    last_password_change_at,
    require_password_change,
  } = settingsData;

  await query(
    `UPDATE user_security_settings SET
      two_factor_enabled = ?,
      two_factor_secret = ?,
      password_changed_at = ?,
      password_expires_at = ?,
      failed_login_attempts = ?,
      account_locked_until = ?,
      last_password_change_at = ?,
      require_password_change = ?,
      updated_at = NOW()
     WHERE user_id = ?`,
    [
      two_factor_enabled,
      two_factor_secret,
      password_changed_at,
      password_expires_at,
      failed_login_attempts,
      account_locked_until,
      last_password_change_at,
      require_password_change,
      userId,
    ]
  );
};

module.exports = {
  getUserProfile,
  upsertUserProfile,
  logLoginAttempt,
  getUserLoginHistory,
  createUserSession,
  getActiveUserSessions,
  deactivateSession,
  deactivateAllUserSessions,
  getUserPreference,
  setUserPreference,
  getUserPreferences,
  logUserActivity,
  getUserActivityLog,
  getUserSecuritySettings,
  updateUserSecuritySettings,
};

