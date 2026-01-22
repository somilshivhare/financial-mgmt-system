const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');
const { env } = require('../config/env');
const userService = require('./userService');

const register = async (fullName, email, password, roleId) => {
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const id = uuidv4();
  await query(
    'INSERT INTO users (id, full_name, email, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
    [id, fullName, email, passwordHash, roleId],
  );
  return { id, fullName, email, roleId };
};

/**
 * Extract device info from user agent
 */
const parseUserAgent = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'desktop';

  // Browser detection
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Device type
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) deviceType = 'mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'tablet';

  return { browser, os, deviceType };
};

const login = async (email, password, loginMetadata = {}) => {
  // Defensive checks: ensure email and password are valid strings before any database query
  if (!email || typeof email !== 'string' || email.trim() === '') {
    throw new Error('INVALID_CREDENTIALS');
  }
  
  if (!password || typeof password !== 'string' || password === '') {
    throw new Error('INVALID_CREDENTIALS');
  }
  
  // Normalize email to lowercase and trim
  const normalizedEmail = email.trim().toLowerCase();
  
  // Sanitize loginMetadata - ensure no undefined values
  const sanitizedMetadata = {
    ip_address: (loginMetadata.ip_address && typeof loginMetadata.ip_address === 'string') 
      ? loginMetadata.ip_address 
      : null,
    user_agent: (loginMetadata.user_agent && typeof loginMetadata.user_agent === 'string') 
      ? loginMetadata.user_agent 
      : null,
  };
  
  const deviceInfo = parseUserAgent(sanitizedMetadata.user_agent || '');
  // Map deviceType to device_type for database - ensure no undefined values
  const mappedDeviceInfo = {
    device_type: deviceInfo.deviceType || null,
    browser: deviceInfo.browser || null,
    os: deviceInfo.os || null,
  };

  // Execute query with normalized email - email is guaranteed to be a non-empty string
  const users = await query(
    `SELECT u.id, u.full_name, u.email, u.password_hash, u.status, r.name as role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [normalizedEmail],
  );
  const user = users[0];
  
  // Log failed login attempt if user doesn't exist
  if (!user) {
    // Try to find user by email for logging (even if credentials are wrong)
    const userByEmail = await query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (userByEmail.length > 0) {
      await userService.logLoginAttempt(userByEmail[0].id, {
        ip_address: sanitizedMetadata.ip_address,
        user_agent: sanitizedMetadata.user_agent,
        ...mappedDeviceInfo,
        status: 'failed',
        failure_reason: 'Invalid password',
      });
    }
    throw new Error('INVALID_CREDENTIALS');
  }

  if (user.status !== 'active') {
    await userService.logLoginAttempt(user.id, {
      ip_address: sanitizedMetadata.ip_address,
      user_agent: sanitizedMetadata.user_agent,
      ...mappedDeviceInfo,
      status: 'failed',
      failure_reason: `Account ${user.status}`,
    });
    throw new Error('INVALID_CREDENTIALS');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  
  if (!ok) {
    await userService.logLoginAttempt(user.id, {
      ip_address: sanitizedMetadata.ip_address,
      user_agent: sanitizedMetadata.user_agent,
      ...mappedDeviceInfo,
      status: 'failed',
      failure_reason: 'Invalid password',
    });
    throw new Error('INVALID_CREDENTIALS');
  }

  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + (env.JWT_EXPIRES_IN.includes('d') 
    ? parseInt(env.JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000 
    : parseInt(env.JWT_EXPIRES_IN) * 60 * 60 * 1000));

  // Update last login - ensure ip_address is never undefined
  await query('UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?', [
    sanitizedMetadata.ip_address || null, 
    user.id
  ]);

  // Log successful login - ensure all values are sanitized
  await userService.logLoginAttempt(user.id, {
    ip_address: sanitizedMetadata.ip_address,
    user_agent: sanitizedMetadata.user_agent,
    ...mappedDeviceInfo,
    status: 'success',
    token_id: tokenHash.substring(0, 16),
  });

  // Create session - ensure all values are sanitized
  await userService.createUserSession(user.id, {
    token_hash: tokenHash,
    ip_address: sanitizedMetadata.ip_address,
    user_agent: sanitizedMetadata.user_agent,
    ...mappedDeviceInfo,
    expires_at: expiresAt,
  });

  return {
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
  };
};

const me = async (userId) => {
  const rows = await query(
    `SELECT u.id, u.full_name, u.email, r.name as role, u.status, 
            u.last_login_at, u.last_login_ip, u.email_verified, u.created_at, u.updated_at
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [userId],
  );
  const user = rows[0];
  if (!user) return null;

  // Get user profile if exists
  const profile = await userService.getUserProfile(userId);
  
  return {
    ...user,
    profile: profile || null,
  };
};

const requestPasswordReset = async (email) => {
  const rows = await query('SELECT id, email, status FROM users WHERE email = ? LIMIT 1', [email]);
  const user = rows[0];

  // Do not leak user existence
  if (!user || user.status !== 'active') {
    return { ok: true };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetId = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    `INSERT INTO password_resets (id, user_id, token_hash, expires_at, used_at, created_at)
     VALUES (?, ?, ?, ?, NULL, NOW())`,
    [resetId, user.id, tokenHash, expiresAt],
  );

  // In production you would email the reset link.
  // For safety, only return token in non-production environments.
  if (env.NODE_ENV !== 'production') {
    return { ok: true, token };
  }
  return { ok: true };
};

const resetPassword = async (token, newPassword) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  return transaction(async (conn) => {
    const [[reset]] = await conn.execute(
      `SELECT id, user_id, expires_at, used_at
       FROM password_resets
       WHERE token_hash = ?
       LIMIT 1
       FOR UPDATE`,
      [tokenHash],
    );

    if (!reset) throw new Error('RESET_TOKEN_INVALID');
    if (reset.used_at) throw new Error('RESET_TOKEN_INVALID');
    if (new Date(reset.expires_at).getTime() < Date.now()) throw new Error('RESET_TOKEN_INVALID');

    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await conn.execute('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, reset.user_id]);
    await conn.execute('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [reset.id]);
    return true;
  });
};

module.exports = { register, login, me, requestPasswordReset, resetPassword };