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

const IGNORABLE_DDL_ERRORS = new Set([
  1060, 1061, // ER_DUP_FIELDNAME, ER_DUP_KEYNAME
  1054, 1091  // ER_BAD_FIELD_ERROR (Unknown column), Can't DROP (column/key) - for optional DROP COLUMN / DROP FK in migrations
]);

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
      if (file === '029_drop_tenant_id.sql') {
        const [refs] = await conn.query(
          `SELECT TABLE_NAME AS tbl, CONSTRAINT_NAME AS fk
           FROM information_schema.KEY_COLUMN_USAGE
           WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
             AND REFERENCED_TABLE_NAME = 'tenants'`
        );
        for (const row of refs || []) {
          const tbl = row.tbl;
          const fk = row.fk;
          if (tbl && fk) {
            try {
              await conn.query(`ALTER TABLE \`${tbl.replace(/`/g, '``')}\` DROP FOREIGN KEY \`${fk.replace(/`/g, '``')}\``);
              console.log(`  Dropped FK ${fk} on ${tbl} (referenced tenants)`);
            } catch (err) {
              if (IGNORABLE_DDL_ERRORS.has(err.errno)) {
                console.log(`  (skipping: ${err.sqlMessage || err.message})`);
              } else {
                throw err;
              }
            }
          }
        }
        await conn.query('DROP TABLE IF EXISTS tenants');
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