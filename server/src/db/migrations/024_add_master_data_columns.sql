-- Add common columns to master_data table to align with application payload 
-- and ensure consistent behavior across environments.
-- These columns extract core data from the 'values' JSON for easier indexing and reporting.

SET @dbname = DATABASE();
SET @tablename = 'master_data';

-- Helper procedure to add column if not exists
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DELIMITER //
CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(100),
    IN columnName VARCHAR(100),
    IN columnDef VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = tableName
        AND COLUMN_NAME = columnName
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDef);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Add core columns
CALL AddColumnIfNotExists(@tablename, 'name', 'VARCHAR(200) NULL AFTER status');
CALL AddColumnIfNotExists(@tablename, 'address', 'TEXT NULL AFTER name');
CALL AddColumnIfNotExists(@tablename, 'city', 'VARCHAR(100) NULL AFTER address');
CALL AddColumnIfNotExists(@tablename, 'state', 'VARCHAR(100) NULL AFTER city');
CALL AddColumnIfNotExists(@tablename, 'country', 'VARCHAR(100) NULL AFTER state');
CALL AddColumnIfNotExists(@tablename, 'gst_no', 'VARCHAR(50) NULL AFTER country');
CALL AddColumnIfNotExists(@tablename, 'contact_person', 'VARCHAR(150) NULL AFTER gst_no');
CALL AddColumnIfNotExists(@tablename, 'contact_number', 'VARCHAR(50) NULL AFTER contact_person');
CALL AddColumnIfNotExists(@tablename, 'email', 'VARCHAR(160) NULL AFTER contact_number');
CALL AddColumnIfNotExists(@tablename, 'designation', 'VARCHAR(100) NULL AFTER email');

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
-- Note: JSON_EXTRACT returns quoted strings, JSON_UNQUOTE removes them.
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

DROP PROCEDURE AddColumnIfNotExists;
