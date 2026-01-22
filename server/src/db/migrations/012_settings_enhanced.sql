-- Enhanced Settings System Migration
-- This migration enhances the settings table to support structured configuration

-- Drop existing settings table if it exists and recreate with enhanced schema
DROP TABLE IF EXISTS settings;

-- Enhanced settings table with structured JSON support
CREATE TABLE IF NOT EXISTS settings (
  id CHAR(36) PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE COMMENT 'e.g., general, invoice, notifications, security',
  setting_value JSON NOT NULL COMMENT 'Structured JSON value for the setting category',
  setting_type ENUM('general', 'invoice', 'notifications', 'security', 'access', 'system') NOT NULL DEFAULT 'general',
  is_locked BOOLEAN DEFAULT FALSE COMMENT 'Locked if transactions exist (e.g., financial year)',
  lock_reason TEXT NULL COMMENT 'Reason for locking (e.g., "Transactions exist for this financial year")',
  updated_by CHAR(36) NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_setting_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_setting_key (setting_key),
  KEY idx_setting_type (setting_type),
  KEY idx_setting_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings audit log for tracking changes
CREATE TABLE IF NOT EXISTS settings_audit_log (
  id CHAR(36) PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL,
  old_value JSON NULL,
  new_value JSON NOT NULL,
  changed_by CHAR(36) NOT NULL,
  change_reason TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_audit_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_settings_audit_key (setting_key),
  KEY idx_settings_audit_user (changed_by),
  KEY idx_settings_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO settings (id, setting_key, setting_value, setting_type, updated_at, created_at) VALUES
  (UUID(), 'general', JSON_OBJECT(
    'companyName', 'Nbaurum',
    'companyEmail', 'finance@nbaurum.com',
    'companyPhone', '+91 00000 00000',
    'financialYear', '2024-2025',
    'currency', 'INR'
  ), 'general', NOW(), NOW()),
  (UUID(), 'invoice', JSON_OBJECT(
    'numberingFormat', 'INV-{YYYY}-{SEQ}',
    'taxDefaultPercent', 18,
    'paymentTermDefault', 'Net 30'
  ), 'invoice', NOW(), NOW()),
  (UUID(), 'notifications', JSON_OBJECT(
    'emailNotifications', true,
    'systemAlerts', true
  ), 'notifications', NOW(), NOW()),
  (UUID(), 'security', JSON_OBJECT(
    'twoFactorEnabled', false,
    'sessionTimeoutMinutes', 30
  ), 'security', NOW(), NOW()),
  (UUID(), 'access', JSON_OBJECT(
    'roles', JSON_ARRAY(
      JSON_OBJECT('name', 'Administrator', 'permissions', JSON_ARRAY('All access')),
      JSON_OBJECT('name', 'Manager', 'permissions', JSON_ARRAY('Invoices: Manage', 'Collections: Manage', 'Reports: View')),
      JSON_OBJECT('name', 'User', 'permissions', JSON_ARRAY('Invoices: View', 'Payments: View')),
      JSON_OBJECT('name', 'Accountant', 'permissions', JSON_ARRAY('Invoices: Manage', 'Payments: Manage'))
    )
  ), 'access', NOW(), NOW())
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

