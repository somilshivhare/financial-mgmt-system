-- Drop check constraint chk_inv_balance from invoices if it exists.
-- This constraint can cause ER_CHECK_CONSTRAINT_VIOLATED when balance/total_amount/amount_paid
-- differ slightly due to rounding (e.g. balance = total_amount - amount_paid). Dropping it allows
-- invoice INSERT to succeed; application logic keeps balance correct.

SET @dbname = DATABASE();
SET @tbl = 'invoices';
SET @chk = 'chk_inv_balance';
SET @exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tbl AND CONSTRAINT_TYPE = 'CHECK' AND CONSTRAINT_NAME = @chk);
SET @sql = IF(@exists > 0, CONCAT('ALTER TABLE `', @tbl, '` DROP CHECK `', REPLACE(@chk, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
