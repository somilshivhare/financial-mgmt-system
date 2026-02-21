-- Remove multi-tenant (SaaS) architecture: drop tenant_id from all tables.
-- Uses INFORMATION_SCHEMA to safely drop FK, index, and column only when they exist.
-- Order per table: 1) Drop FK on tenant_id, 2) Drop index on tenant_id, 3) Drop tenant_id column.
-- Idempotent: safe to run multiple times.

-- Initialize variables
SET @fk_name = NULL;
SET @idx_name = NULL;
SET @col_count = 0;
SET @sql = NULL;

-- ========== users ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `users` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `users` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `users` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== customers ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `customers` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `customers` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `customers` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== purchase_orders ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_orders' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `purchase_orders` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_orders' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `purchase_orders` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_orders' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `purchase_orders` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== invoices ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoices' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `invoices` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoices' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `invoices` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoices' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `invoices` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== products ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `products` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `products` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `products` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== invoice_lines ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoice_lines' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `invoice_lines` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoice_lines' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `invoice_lines` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoice_lines' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `invoice_lines` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== payments ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `payments` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `payments` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `payments` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== payment_advices ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_advices' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `payment_advices` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_advices' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `payment_advices` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_advices' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `payment_advices` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== payment_allocations ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_allocations' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `payment_allocations` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_allocations' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `payment_allocations` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_allocations' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `payment_allocations` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== collection_plans ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collection_plans' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `collection_plans` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collection_plans' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `collection_plans` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collection_plans' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `collection_plans` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== collection_actions ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collection_actions' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `collection_actions` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collection_actions' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `collection_actions` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collection_actions' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `collection_actions` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== collections (if exists) ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `collections` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `collections` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `collections` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== master_data ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'master_data' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `master_data` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'master_data' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `master_data` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'master_data' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `master_data` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== notifications ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `notifications` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `notifications` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `notifications` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== settings ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `settings` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `settings` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `settings` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== support_tickets ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `support_tickets` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `support_tickets` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `support_tickets` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== subscriptions ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscriptions' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `subscriptions` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscriptions' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `subscriptions` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscriptions' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `subscriptions` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== Additional tables (idempotent: no-op if table/column missing) ==========
-- business_units, segments, regions, zones, meetings, meeting_minutes, meeting_participants,
-- alerts, purchase_order_lines, po_status_history, user_profiles, password_resets, roles,
-- storage_usage, subscription_plans

-- business_units
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_units' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `business_units` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_units' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `business_units` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_units' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `business_units` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- segments
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'segments' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `segments` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'segments' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `segments` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'segments' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `segments` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- regions
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'regions' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `regions` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'regions' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `regions` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'regions' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `regions` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- zones
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'zones' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `zones` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'zones' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `zones` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'zones' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `zones` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- meetings, meeting_minutes, meeting_participants, alerts
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meetings' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `meetings` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meetings' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `meetings` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meetings' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `meetings` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `meeting_minutes` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `meeting_minutes` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `meeting_minutes` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_participants' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `meeting_participants` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_participants' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `meeting_participants` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_participants' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `meeting_participants` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `alerts` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `alerts` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `alerts` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- purchase_order_lines, po_status_history, user_profiles, password_resets, roles, storage_usage, subscription_plans
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_order_lines' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `purchase_order_lines` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_order_lines' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `purchase_order_lines` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_order_lines' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `purchase_order_lines` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'po_status_history' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `po_status_history` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'po_status_history' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `po_status_history` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'po_status_history' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `po_status_history` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `user_profiles` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `user_profiles` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `user_profiles` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_resets' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `password_resets` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_resets' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `password_resets` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'password_resets' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `password_resets` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `roles` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `roles` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `roles` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'storage_usage' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `storage_usage` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'storage_usage' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `storage_usage` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'storage_usage' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `storage_usage` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscription_plans' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `subscription_plans` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscription_plans' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `subscription_plans` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscription_plans' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `subscription_plans` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== notification_preferences (references tenants - must clear before DROP TABLE tenants) ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification_preferences' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `notification_preferences` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification_preferences' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `notification_preferences` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification_preferences' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `notification_preferences` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== storage_alerts (references tenants - must clear before DROP TABLE tenants) ==========
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'storage_alerts' AND COLUMN_NAME = 'tenant_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1;
SET @sql = IF(@fk_name IS NOT NULL AND @fk_name != '', CONCAT('ALTER TABLE `storage_alerts` DROP FOREIGN KEY `', REPLACE(@fk_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_name = NULL;
SELECT INDEX_NAME INTO @idx_name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'storage_alerts' AND COLUMN_NAME = 'tenant_id' LIMIT 1;
SET @sql = IF(@idx_name IS NOT NULL AND @idx_name != '', CONCAT('ALTER TABLE `storage_alerts` DROP INDEX `', REPLACE(@idx_name, '`', '``'), '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'storage_alerts' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_count > 0, 'ALTER TABLE `storage_alerts` DROP COLUMN tenant_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- NOTE: DROP TABLE tenants is done by migrate.js after dropping all FKs that reference tenants (handles any table name)
