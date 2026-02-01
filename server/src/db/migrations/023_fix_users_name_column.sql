-- Add 'name' column to users table as an alias for 'full_name' 
-- to support queries using 'u.name' and prevent ER_BAD_FIELD_ERROR
-- on servers where schema might not perfectly match local dev.

SET @dbname = DATABASE();
SET @tablename = 'users';

-- 1) Add name column if it doesn't exist
SET @columnname = 'name';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(120) NULL AFTER full_name')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2) Backfill 'name' from 'full_name'
UPDATE users SET name = full_name WHERE name IS NULL OR name = '';

-- 3) Ensure future updates to full_name are reflected in name (best effort)
-- Note: We could use a trigger here, but simple column addition is usually enough for report queries.
