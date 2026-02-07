const { pool } = require('./pool');

const fixMigrations = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'meetings' 
      AND COLUMN_NAME IN ('meeting_type', 'agenda', 'status')
    `);

    if (columns.length > 0) {
      const [existing] = await pool.query(
        'SELECT filename FROM schema_migrations WHERE filename = ?',
        ['010_mom_enhancement.sql']
      );
      
      if (existing.length === 0) {
        await pool.query(
          'INSERT INTO schema_migrations (filename) VALUES (?)',
          ['010_mom_enhancement.sql']
        );
        console.log('Marked 010_mom_enhancement.sql as applied (columns already exist)');
      }
    }

    console.log('Migration fix complete');
    await pool.end();
  } catch (err) {
    console.error('Error fixing migrations:', err);
    process.exit(1);
  }
};

fixMigrations();

