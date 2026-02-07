/**
 * Seed or update the official admin user so login works with:
 *   Email: nbaurumadmin2026@gmail.com
 *   Password: Nbaurum@2026
 *
 * Run from server directory: node scripts/seed-admin.js
 * Requires .env (DB_*, BCRYPT_ROUNDS optional) and database to be up.
 */
require('../src/config/env');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../src/db/query');
const { pool } = require('../src/db/pool');
const { env } = require('../src/config/env');

const ADMIN_EMAIL = 'nbaurumadmin2026@gmail.com';
const ADMIN_PASSWORD = 'Nbaurum@2026';
const ADMIN_FULL_NAME = 'Admin';
const ADMIN_ROLE_ID = 1;

async function seedAdmin() {
  const rounds = env.BCRYPT_ROUNDS || 10;
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, rounds);

  const existing = await query('SELECT id, email, role_id, status FROM users WHERE email = ?', [ADMIN_EMAIL]);

  if (existing.length > 0) {
    await query(
      'UPDATE users SET password_hash = ?, role_id = ?, status = ? WHERE email = ?',
      [passwordHash, ADMIN_ROLE_ID, 'active', ADMIN_EMAIL]
    );
    console.log('Admin user updated: ' + ADMIN_EMAIL);
  } else {
    const id = uuidv4();
    await query(
      `INSERT INTO users (id, full_name, email, password_hash, role_id, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [id, ADMIN_FULL_NAME, ADMIN_EMAIL, passwordHash, ADMIN_ROLE_ID]
    );
    console.log('Admin user created: ' + ADMIN_EMAIL);
  }
}

seedAdmin()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err.message);
    pool.end();
    process.exit(1);
  });
