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

const IGNORABLE_DDL_ERRORS = new Set([1060, 1061]); // ER_DUP_FIELDNAME, ER_DUP_KEYNAME

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
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const statements = sql
        .split(/\s*;\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (statements.length === 0) {
        await conn.query(sql);
      } else {
        for (const stmt of statements) {
          const toRun = stmt.endsWith(';') ? stmt : stmt + ';';
          try {
            await conn.query(toRun);
          } catch (err) {
            if (IGNORABLE_DDL_ERRORS.has(err.errno)) {
              console.log(`  (skipping: ${err.sqlMessage || err.message})`);
            } else {
              throw err;
            }
          }
        }
      }
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