-- Drop check constraint chk_inv_amounts_non_neg from invoices if it exists.
-- This constraint (e.g. amount_paid >= 0, balance >= 0) can be violated by rounding
-- or overpayment. Dropping it allows payment UPDATE on invoices to succeed.

SET @dbname = DATABASE();
SET @tbl = 'invoices';
SET @chk = 'chk_inv_amounts_non_neg';
SET @exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tbl AND CONSTRAINT_TYPE = 'CHECK' AND CONSTRAINT_NAME = @chk);
SET @sql = IF(@exists > 0, CONCAT('ALTER TABLE `', @tbl, '` DROP CHECK `', REPLACE(@chk, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
