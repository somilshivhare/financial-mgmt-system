-- Add common columns to master_data table to align with application payload 
-- and ensure consistent behavior across environments.
-- These columns extract core data from the 'values' JSON for easier indexing and reporting.

SET @dbname = DATABASE();
SET @tablename = 'master_data';

-- 1) name
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'name') > 0,
  'SELECT 1',
  'ALTER TABLE master_data ADD COLUMN name VARCHAR(200) NULL AFTER status'
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

-- 2) address
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'address') > 0,
  'SELECT 1',
  'ALTER TABLE master_data ADD COLUMN address TEXT NULL AFTER name'
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

-- 3) city
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'city') > 0,
  'SELECT 1',
  'ALTER TABLE master_data ADD COLUMN city VARCHAR(100) NULL AFTER address'
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

-- 4) state
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'state') > 0,
  'SELECT 1',
  'ALTER TABLE master_data ADD COLUMN state VARCHAR(100) NULL AFTER city'
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

-- 5) country
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'country') > 0,
  'SELECT 1',
  'ALTER TABLE master_data ADD COLUMN country VARCHAR(100) NULL AFTER state'
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

-- 6) gst_no
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'gst_no') > 0,
  'SELECT 1',
  'ALTER TABLE master_data ADD COLUMN gst_no VARCHAR(50) NULL AFTER country'
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

-- 7) contact_person
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'contact_person') > 0,
  'SELECT 1',
  'ALTER TABLE master_data ADD COLUMN contact_person VARCHAR(150) NULL AFTER gst_no'
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

-- 8) contact_number
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'contact_number') > 0,
  'SELECT 1',
  'ALTER TABLE master_data ADD COLUMN contact_number VARCHAR(50) NULL AFTER contact_person'
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

-- 9) email
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'email') > 0,
  'SELECT 1',
  'ALTER TABLE master_data ADD COLUMN email VARCHAR(160) NULL AFTER contact_number'
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

-- 10) designation
SET @stmt = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'designation') > 0,
  'SELECT 1',
  'ALTER TABLE master_data ADD COLUMN designation VARCHAR(100) NULL AFTER email'
));
PREPARE p FROM @stmt; EXECUTE p; DEALLOCATE PREPARE p;

-- Add indexes for common filter fields
SET @add_idx_name = (SELECT IF(
    EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_master_data_name'),
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD KEY idx_master_data_name (name)')
));
PREPARE stmt_idx_name FROM @add_idx_name; EXECUTE stmt_idx_name; DEALLOCATE PREPARE stmt_idx_name;

SET @add_idx_gst = (SELECT IF(
    EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_master_data_gst'),
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD KEY idx_master_data_gst (gst_no)')
));
PREPARE stmt_idx_gst FROM @add_idx_gst; EXECUTE stmt_idx_gst; DEALLOCATE PREPARE stmt_idx_gst;

-- Backfill data from JSON values (best effort for common keys)
UPDATE master_data SET 
    name = COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.payerName')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.consigneeName')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.companyName')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.customerName')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.nameOfEmployee')), 'null')
    ),
    address = COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.payerAddress')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.consigneeAddress')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.corporateOfficeAddress')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.correspondenceAddress')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.address')), 'null')
    ),
    gst_no = COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.payerGSTNo')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.consigneeGSTNo')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.gstNo')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.otherOfficeGST')), 'null')
    ),
    city = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.city')), 'null'),
    state = COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.state')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.corporateState')), 'null')
    ),
    country = COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.country')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.corporateCountry')), 'null')
    ),
    contact_person = COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.contactPersonName')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.poIssuingAuthority')), 'null')
    ),
    contact_number = COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.contactNumber')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.contactPersonContactNo')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.contactNo')), 'null')
    ),
    email = COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.emailId')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.customerEmail')), 'null')
    ),
    designation = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`values`, '$.designation')), 'null')
WHERE name IS NULL;
