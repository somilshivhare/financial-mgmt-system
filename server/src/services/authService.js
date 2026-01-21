const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../db/query');
const { env } = require('../config/env');

const register = async (fullName, email, password, roleId) => {
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const id = uuidv4();
  await query(
    'INSERT INTO users (id, full_name, email, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
    [id, fullName, email, passwordHash, roleId],
  );
  return { id, fullName, email, roleId };
};

const login = async (email, password) => {
  const users = await query(
    `SELECT u.id, u.full_name, u.email, u.password_hash, u.status, r.name as role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [email],
  );
  const user = users[0];
  if (!user) throw new Error('INVALID_CREDENTIALS');
  if (user.status !== 'active') throw new Error('INVALID_CREDENTIALS');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');

  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

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
    `SELECT u.id, u.full_name, u.email, r.name as role, u.status, u.created_at, u.updated_at
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [userId],
  );
  return rows[0] || null;
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