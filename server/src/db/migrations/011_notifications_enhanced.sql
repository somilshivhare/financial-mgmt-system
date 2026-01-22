-- Enhanced Notifications and Alerts System Migration
-- This migration creates the notifications table and notification preferences
-- Note: We don't drop alerts table as it may contain existing data

-- Enhanced notifications table with all required fields
CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL COMMENT 'NULL for global/role-based notifications',
  role_id INT NULL COMMENT 'Target role for role-based notifications',
  type VARCHAR(80) NOT NULL COMMENT 'invoice_created, po_approval_pending, payment_due, payment_overdue, payment_received, master_data_changed, po_approved, collection_followup, system_action, admin_announcement',
  message TEXT NOT NULL,
  reference_type VARCHAR(50) NULL COMMENT 'invoice, po, payment, master_data, etc.',
  reference_id CHAR(36) NULL COMMENT 'ID of the referenced entity',
  status ENUM('new', 'read', 'dismissed') DEFAULT 'new',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  link_url VARCHAR(500) NULL COMMENT 'URL to navigate to relevant page',
  metadata JSON NULL COMMENT 'Additional context data',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  dismissed_at DATETIME NULL,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  KEY idx_notification_user (user_id),
  KEY idx_notification_role (role_id),
  KEY idx_notification_type (type),
  KEY idx_notification_status (status),
  KEY idx_notification_priority (priority),
  KEY idx_notification_created (created_at),
  KEY idx_notification_user_status (user_id, status),
  KEY idx_notification_reference (reference_type, reference_id),
  KEY idx_notification_user_type_status (user_id, type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  notification_type VARCHAR(80) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_pref_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_notif_pref_user_type (user_id, notification_type),
  KEY idx_notif_pref_user (user_id),
  KEY idx_notif_pref_type (notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default notification preferences for all notification types
-- This will be populated per user on first access
-- Notification types: invoice_created, invoice_approval_pending, payment_due, payment_overdue, 
-- payment_received, master_data_changed, po_created, po_approval_pending, po_approved, 
-- collection_followup, system_action, admin_announcement

-- Notification delivery log for audit trail
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id CHAR(36) PRIMARY KEY,
  notification_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  delivery_method ENUM('websocket', 'sse', 'polling', 'email') NOT NULL,
  delivery_status ENUM('pending', 'delivered', 'failed') DEFAULT 'pending',
  delivered_at DATETIME NULL,
  error_message TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_delivery_notif FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_delivery_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_notif_delivery_notif (notification_id),
  KEY idx_notif_delivery_user (user_id),
  KEY idx_notif_delivery_status (delivery_status),
  KEY idx_notif_delivery_method (delivery_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

