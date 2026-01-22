-- Storage System Migration
-- This migration creates tables for tracking storage usage per user/organization

-- Subscription Plans: Define storage limits and features per plan
CREATE TABLE IF NOT EXISTS subscription_plans (
  id CHAR(36) PRIMARY KEY,
  plan_name VARCHAR(80) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  storage_limit_gb DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  features JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_plan_name (plan_name),
  KEY idx_is_active (is_active)
);

-- Insert default subscription plans
INSERT IGNORE INTO subscription_plans (id, plan_name, display_name, storage_limit_gb, features) VALUES
  (UUID(), 'trial', 'Trial Plan', 1.00, JSON_OBJECT('max_users', 1, 'support_level', 'community')),
  (UUID(), 'basic', 'Basic Plan', 10.00, JSON_OBJECT('max_users', 5, 'support_level', 'email')),
  (UUID(), 'professional', 'Professional Plan', 50.00, JSON_OBJECT('max_users', 25, 'support_level', 'priority')),
  (UUID(), 'enterprise', 'Enterprise Plan', 500.00, JSON_OBJECT('max_users', -1, 'support_level', 'dedicated'));

-- Update subscriptions table to link to users
-- Check if columns exist before adding (MySQL doesn't support IF NOT EXISTS in ALTER TABLE)
SET @dbname = DATABASE();
SET @tablename = 'subscriptions';
SET @columnname = 'user_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' CHAR(36)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'organization_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' CHAR(36)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key constraint if it doesn't exist
SET @constraint_name = 'fk_subscription_user';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (CONSTRAINT_NAME = @constraint_name)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD CONSTRAINT ', @constraint_name, ' FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add indexes if they don't exist
SET @indexname = 'idx_subscription_user';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD KEY ', @indexname, ' (user_id)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @indexname = 'idx_subscription_org';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD KEY ', @indexname, ' (organization_id)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Storage Files: Track all file uploads in the system
CREATE TABLE IF NOT EXISTS storage_files (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes BIGINT UNSIGNED NOT NULL,
  mime_type VARCHAR(100),
  entity_type VARCHAR(80) NOT NULL COMMENT 'Type of entity: invoice, payment, document, export, attachment, report, master_data, etc.',
  entity_id CHAR(36) COMMENT 'ID of the related entity (invoice_id, payment_id, etc.)',
  uploaded_by CHAR(36) NOT NULL,
  storage_provider VARCHAR(50) DEFAULT 'local' COMMENT 'local, s3, azure, etc.',
  checksum VARCHAR(64) COMMENT 'SHA-256 hash for integrity verification',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at DATETIME NULL,
  deleted_by CHAR(36) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_storage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_storage_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id),
  CONSTRAINT fk_storage_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id),
  KEY idx_storage_user (user_id),
  KEY idx_storage_entity (entity_type, entity_id),
  KEY idx_storage_uploaded_by (uploaded_by),
  KEY idx_storage_created (created_at),
  KEY idx_storage_deleted (is_deleted, deleted_at),
  KEY idx_storage_user_active (user_id, is_deleted)
);

-- Storage Alerts: Track storage usage warnings and critical alerts
CREATE TABLE IF NOT EXISTS storage_alerts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  alert_type ENUM('warning_80', 'critical_95', 'quota_exceeded') NOT NULL,
  message TEXT NOT NULL,
  storage_used_gb DECIMAL(10,2) NOT NULL,
  storage_limit_gb DECIMAL(10,2) NOT NULL,
  usage_percentage DECIMAL(5,2) NOT NULL,
  status ENUM('active', 'dismissed', 'resolved') DEFAULT 'active',
  dismissed_at DATETIME NULL,
  dismissed_by CHAR(36) NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_storage_alert_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_storage_alert_dismissed_by FOREIGN KEY (dismissed_by) REFERENCES users(id),
  KEY idx_storage_alert_user (user_id),
  KEY idx_storage_alert_type (alert_type),
  KEY idx_storage_alert_status (status),
  KEY idx_storage_alert_user_status (user_id, status)
);

-- Storage Usage Cache: Cache calculated storage usage for performance
CREATE TABLE IF NOT EXISTS storage_usage_cache (
  user_id CHAR(36) PRIMARY KEY,
  total_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  total_gb DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
  file_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_calculated_at DATETIME NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_storage_cache_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

