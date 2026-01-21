const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const runMigrations = async () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  await ensureMigrationsTable();
  for (const file of files) {
    const [already] = await pool.query('SELECT filename FROM schema_migrations WHERE filename = ? LIMIT 1', [file]);
    if (already.length) {
      console.log(`Skipping migration ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running migration ${file}`);
    // Run each migration in a transaction and mark as applied (idempotent migrations still recommended)
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
  console.log('Migrations complete');
  await pool.end();
};

runMigrations().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});