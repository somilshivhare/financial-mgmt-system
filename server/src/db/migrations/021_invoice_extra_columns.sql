-- Add extra invoice columns for full form persistence (Customer & PO details, etc.)
-- Idempotent: only adds columns if they don't exist

SET @dbname = DATABASE();
SET @tablename = 'invoices';

-- invoice_type (REG, EXP, TAX, PRO, Other)
SET @col = 'invoice_type';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' VARCHAR(50) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'business_unit';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' VARCHAR(50) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'customer_name';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' VARCHAR(200) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'segment';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' VARCHAR(50) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'region';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' VARCHAR(50) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'zone';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' VARCHAR(50) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'account_manager_name';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' VARCHAR(200) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'account_manager_id';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' CHAR(36) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'po_no_reference';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' VARCHAR(100) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'po_date';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' DATE NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'state_of_supply';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' VARCHAR(100) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'payment_terms_id';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' CHAR(36) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'payment_terms';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' TEXT NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'consignee_id';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' CHAR(36) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

SET @col = 'payer_id';
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @col, ' CHAR(36) NULL')
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;
